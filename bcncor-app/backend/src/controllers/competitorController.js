/**
 * controllers/competitorController.js
 *
 * Handles the Competitor workflow endpoints:
 *  GET  /api/workflows/competitor/sources                    → list of configured competitor sources
 *  GET  /api/workflows/competitor/articles                   → all scraped articles in memory
 *  GET  /api/workflows/competitor/status                     → last run stats + log
 *  POST /api/workflows/competitor/run                        → scrape all (or subset) of competitors
 *  POST /api/workflows/competitor/articles/:articleId/send-to-inbox → push article into shared inbox
 */

const axios     = require('axios');
const cheerio   = require('cheerio');
const Anthropic  = require('@anthropic-ai/sdk');
const { inboxItems } = require('../store/inboxStore');
const { scrapeLinkedInPosts, scrapeInstagramPosts } = require('../services/apifyService');
const { getAnthropicKey } = require('./settingsController');
const db = require('../config/db');
const { create: createDraft, generateDraft } = require('./blogDraftsController');

// ── Competitor sources ────────────────────────────────────────────────────────

function toSlug(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function loadCompetitors() {
  const { rows } = await db.query('SELECT * FROM competitors ORDER BY id');
  return rows.map(row => ({
    id:            toSlug(row.name),
    dbId:          row.id,
    name:          row.name,
    listingUrl:    row.url,
    wpApiBase:     row.wp_api_base  || null,
    articlePrefix: row.article_prefix || null,
    linkedinUrl:     row.linkedin_id
      ? `https://www.linkedin.com/company/${row.linkedin_id}/`
      : null,
    instagramHandle: row.instagram_id || null,
    disabled: false,
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanText(str) {
  return (str || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveUrl(base, href) {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Scraping ──────────────────────────────────────────────────────────────────

const AXIOS_OPTS = {
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
};

// Paths that clearly aren't articles
const SKIP_PATTERNS = [
  /\/(tag|tags|categoria|category|categories|author|authors|page|pagina|search|buscar|archive)\//i,
  /\/(wp-content|wp-admin|wp-login|feed|rss|sitemap)/i,
  /#/,
  /\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|xml)$/i,
];

function looksLikeArticle(url, origin) {
  try {
    const u = new URL(url);
    if (u.origin !== origin) return false;
    const p = u.pathname.replace(/\/$/, '');
    if (p === '' || p === '/') return false;
    const segments = p.split('/').filter(Boolean);
    if (segments.length < 1) return false;
    if (SKIP_PATTERNS.some(re => re.test(url))) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchViaWpApi(competitor) {
  const url = `${competitor.wpApiBase}/posts?per_page=10&_fields=id,title,link,date,excerpt`;
  const { data } = await axios.get(url, AXIOS_OPTS);
  return data.map(post => ({
    id:             generateId(),
    competitorId:   competitor.id,
    competitorName: competitor.name,
    url:            post.link,
    title:          post.title?.rendered?.replace(/&#\d+;/g, c => String.fromCharCode(parseInt(c.match(/\d+/)[0]))) || post.link,
    publishDate:    post.date?.slice(0, 10) || '',
    excerpt:        (post.excerpt?.rendered || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200),
    contentText:    '',
    fetchStatus:    'listing_only',
    score:          null,
    priority:       null,
    sentToInbox:    false,
    scrapedAt:      new Date().toISOString(),
  }));
}

async function scrapeListingPage(competitor) {
  const { data: html } = await axios.get(competitor.listingUrl, AXIOS_OPTS);
  const $        = cheerio.load(html);
  const base     = competitor.listingUrl;
  const origin   = new URL(competitor.listingUrl).origin;
  const listingPath = new URL(competitor.listingUrl).pathname;

  const seen  = new Set();
  const strict = [];   // under listingPath
  const broad  = [];   // same domain, looks like an article

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const url  = resolveUrl(base, href);
    if (!url || seen.has(url)) return;
    try {
      const urlPath = new URL(url).pathname;
      if (urlPath === listingPath) return; // skip listing page itself
      seen.add(url);

      const matchPrefix = competitor.articlePrefix || listingPath;
      if (urlPath.startsWith(matchPrefix) && urlPath.length > matchPrefix.length && !urlPath.includes('/category/') && !urlPath.includes('/page/')) {
        strict.push(url);
      } else if (looksLikeArticle(url, origin)) {
        broad.push(url);
      }
    } catch { /* skip malformed */ }
  });

  // Prefer links under the listing path; fall back to broader same-domain links
  const result = strict.length >= 3 ? strict : broad;
  return result.slice(0, 10);
}

async function scrapeArticlePage(url) {
  let html;
  try {
    const res = await axios.get(url, AXIOS_OPTS);
    html = res.data;
  } catch {
    return { title: '', publishDate: '', contentText: '', fetchStatus: 'fetch_failed' };
  }

  const $ = cheerio.load(html);

  // Title: og:title → h1 → <title>
  const title =
    cleanText($('meta[property="og:title"]').attr('content')) ||
    cleanText($('h1').first().text()) ||
    cleanText($('title').text());

  // Date: <time datetime> → article:published_time meta
  const publishDate =
    $('time[datetime]').first().attr('datetime')?.slice(0, 10) ||
    $('meta[property="article:published_time"]').attr('content')?.slice(0, 10) ||
    '';

  // Body: strip noise then extract article / main
  $('script, style, nav, header, footer, [class*="menu"], [class*="sidebar"], [class*="widget"], iframe, noscript').remove();

  let contentText = '';
  const contentEl = $('article, main, .post-content, .entry-content, [class*="content"]').first();
  if (contentEl.length) {
    contentText = cleanText(contentEl.text());
  } else {
    const parts = [];
    $('body p').each((_, el) => {
      const t = cleanText($(el).text());
      if (t.length > 40) parts.push(t);
    });
    contentText = parts.join('\n\n');
  }

  return {
    title,
    publishDate,
    contentText: contentText.slice(0, 8000),
    fetchStatus: contentText.length > 0 ? 'ok' : 'listing_only',
  };
}

// ── GET /api/workflows/competitor/sources ─────────────────────────────────────

async function sources(_req, res, next) {
  try {
    const competitors = await loadCompetitors();
    res.json({ competitors });
  } catch (err) { next(err); }
}

// ── GET /api/workflows/competitor/articles ────────────────────────────────────

async function articles(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM competitor_articles ORDER BY scraped_at DESC');
    const mapped = rows.map(r => ({
      id:             r.id,
      competitorId:   r.competitor_id,
      competitorName: r.competitor_name,
      url:            r.url,
      title:          r.title,
      publishDate:    r.publish_date,
      excerpt:        r.excerpt,
      contentText:    r.content_text,
      fetchStatus:    r.fetch_status,
      score:          r.score,
      priority:       r.priority,
      sentToInbox:    r.sent_to_inbox,
      scrapedAt:      r.scraped_at,
      dimensions: {
        strategic: r.dim_strategic,
        intent:    r.dim_intent,
        seo:       r.dim_seo,
        gap:       r.dim_gap,
      },
    }));
    res.json({ articles: mapped });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/workflows/competitor/status ──────────────────────────────────────

async function status(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM scraper_runs ORDER BY run_at DESC LIMIT 1');
    const row = rows[0] || null;
    res.json({
      lastRunStats: row ? {
        runAt:              row.run_at,
        competitorsScraped: row.competitors_scraped,
        articlesFound:      row.articles_found,
      } : null,
      runLog:       row?.run_log ?? [],
      articleCount: (await db.query('SELECT COUNT(*) FROM competitor_articles')).rows[0].count,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/workflows/competitor/run ────────────────────────────────────────

async function run(req, res, next) {
  try {
    const { ids, blogOnly } = req.body || {};
    const all = await loadCompetitors();
    const targets = Array.isArray(ids) && ids.length > 0
      ? all.filter(c => ids.includes(c.dbId) || ids.includes(c.id))
      : all;

    const runLog = [];
    const log = (text) => runLog.push({ time: new Date().toISOString(), text });

    let totalArticles = 0;

    // Load existing URLs from DB to deduplicate
    const { rows: existingRows } = await db.query('SELECT url FROM competitor_articles');
    const existingUrls = new Set(existingRows.map(r => r.url));

    for (const competitor of targets) {
      if (competitor.disabled) { log(`Skipping ${competitor.name} (disabled)`); continue; }
      log(`Scraping ${competitor.name}…`);

      // Use WordPress REST API if available (avoids JS-rendered listing pages)
      if (competitor.wpApiBase) {
        let wpSuccess = false;
        try {
          const wpArticles = await fetchViaWpApi(competitor);
          const fresh = wpArticles.filter(a => !existingUrls.has(a.url));
          for (const a of fresh) {
            await new Promise(r => setTimeout(r, 600));
            const { contentText, fetchStatus } = await scrapeArticlePage(a.url);
            await db.query(
              `INSERT INTO competitor_articles
                (id, competitor_id, competitor_name, url, title, publish_date, excerpt, content_text,
                 fetch_status, score, priority, sent_to_inbox, scraped_at,
                 dim_strategic, dim_intent, dim_seo, dim_gap)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
               ON CONFLICT (id) DO NOTHING`,
              [
                a.id, a.competitorId, a.competitorName, a.url, a.title,
                a.publishDate, a.excerpt, contentText, fetchStatus,
                a.score, a.priority, a.sentToInbox, a.scrapedAt,
                null, null, null, null,
              ]
            );
            existingUrls.add(a.url);
          }
          totalArticles += fresh.length;
          log(`${fresh.length} article${fresh.length !== 1 ? 's' : ''} found for ${competitor.name}`);
          wpSuccess = true;
        } catch (err) {
          log(`Failed WP API for ${competitor.name}: ${err.message} — falling back to HTML scraping`);
        }
        if (wpSuccess) continue;
        // Fall through to HTML scraping below if WP API failed
      }

      let articleUrls = [];
      try {
        articleUrls = await scrapeListingPage(competitor);
        log(`${articleUrls.length} article${articleUrls.length !== 1 ? 's' : ''} found for ${competitor.name}`);
      } catch (err) {
        log(`Failed to scrape listing for ${competitor.name}: ${err.message}`);
        continue;
      }

      for (const url of articleUrls) {
        if (existingUrls.has(url)) continue;

        await new Promise(r => setTimeout(r, 600));

        const { title, publishDate, contentText, fetchStatus } = await scrapeArticlePage(url);
        const a = {
          id:             generateId(),
          competitorId:   competitor.id,
          competitorName: competitor.name,
          url,
          title:          title || url,
          publishDate,
          excerpt:        contentText.slice(0, 200),
          contentText,
          fetchStatus,
          score:          null,
          priority:       null,
          sentToInbox:    false,
          scrapedAt:      new Date().toISOString(),
        };

        await db.query(
          `INSERT INTO competitor_articles
            (id, competitor_id, competitor_name, url, title, publish_date, excerpt, content_text,
             fetch_status, score, priority, sent_to_inbox, scraped_at,
             dim_strategic, dim_intent, dim_seo, dim_gap)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           ON CONFLICT (id) DO NOTHING`,
          [
            a.id, a.competitorId, a.competitorName, a.url, a.title,
            a.publishDate, a.excerpt, a.contentText, a.fetchStatus,
            a.score, a.priority, a.sentToInbox, a.scrapedAt,
            null, null, null, null,
          ]
        );
        existingUrls.add(url);
        totalArticles++;
      }
    }

    const lastRunStats = {
      runAt:               new Date().toISOString(),
      competitorsScraped:  targets.length,
      articlesFound:       totalArticles,
    };

    log(`Run complete — ${totalArticles} article${totalArticles !== 1 ? 's' : ''} scraped across ${targets.length} competitor${targets.length !== 1 ? 's' : ''}`);

    // ── LinkedIn scraping via Apify ──────────────────────────────────────────
    let linkedInScraped = 0;
    const linkedInErrors = [];

    if (blogOnly) {
      log('LinkedIn scraping skipped — blog only run');
    } else try {
      if (!process.env.APIFY_TOKEN) {
        log('LinkedIn scraping skipped — APIFY_TOKEN not set');
      } else {
        const linkedinUrls = targets
          .filter(s => s.linkedinUrl && !s.disabled)
          .map(s => s.linkedinUrl);

        if (linkedinUrls.length > 0) {
          log(`Scraping LinkedIn posts for ${linkedinUrls.length} competitors via Apify…`);
          const posts = await scrapeLinkedInPosts(linkedinUrls, targets, 5);

          for (const post of posts) {
            try {
              await db.query(
                `INSERT INTO linkedin_posts
                  (id, channel, source, competitor, competitor_id, title, content, url, date,
                   is_repost, reposted_from, image_url, video_url, article_title, article_url,
                   likes, comments, shares, status, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  post.id, post.channel, post.source, post.competitor, post.competitorId,
                  post.title, post.content, post.url, post.date,
                  post.isRepost, post.repostedFrom, post.imageUrl, post.videoUrl,
                  post.articleTitle, post.articleUrl,
                  post.engagement?.likes, post.engagement?.comments, post.engagement?.shares,
                  post.status, post.createdAt,
                ]
              );
              linkedInScraped++;
            } catch (e) {
              linkedInErrors.push({ id: post.id, reason: e.message });
            }
          }
          log(`LinkedIn: ${linkedInScraped} new post${linkedInScraped !== 1 ? 's' : ''} scraped`);
        } else {
          log('No LinkedIn URLs configured — skipping LinkedIn scraping');
        }
      }
    } catch (linkedInErr) {
      log(`LinkedIn scraping failed: ${linkedInErr.message}`);
      linkedInErrors.push({ reason: linkedInErr.message });
    }

    // ── Instagram scraping via Apify ────────────────────────────────────────
    let instagramScraped = 0;
    const instagramErrors = [];

    if (blogOnly) {
      log('Instagram scraping skipped — blog only run');
    } else try {
      if (!process.env.APIFY_TOKEN) {
        log('Instagram scraping skipped — APIFY_TOKEN not set');
      } else {
        const igHandles = targets
          .filter(s => s.instagramHandle && !s.disabled)
          .map(s => s.instagramHandle);

        if (igHandles.length > 0) {
          log(`Scraping Instagram posts for ${igHandles.length} competitors via Apify…`);
          const posts = await scrapeInstagramPosts(igHandles, targets, 5);

          for (const post of posts) {
            try {
              await db.query(
                `INSERT INTO instagram_posts
                  (id, competitor, competitor_id, content, url, image_url, video_url,
                   post_type, posted_at, likes, comments, scraped_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  post.id, post.competitor, post.competitorId, post.content,
                  post.url, post.imageUrl, post.videoUrl, post.postType,
                  post.date, post.likes, post.comments, post.createdAt,
                ]
              );
              instagramScraped++;
            } catch (e) {
              instagramErrors.push({ id: post.id, reason: e.message });
            }
          }
          log(`Instagram: ${instagramScraped} new post${instagramScraped !== 1 ? 's' : ''} scraped`);
        } else {
          log('No Instagram handles configured — skipping Instagram scraping');
        }
      }
    } catch (igErr) {
      log(`Instagram scraping failed: ${igErr.message}`);
      instagramErrors.push({ reason: igErr.message });
    }

    await db.query(
      `INSERT INTO scraper_runs (run_at, competitors_scraped, articles_found, linkedin_posts_scraped, run_log)
       VALUES ($1,$2,$3,$4,$5)`,
      [lastRunStats.runAt, lastRunStats.competitorsScraped, lastRunStats.articlesFound, linkedInScraped, JSON.stringify(runLog)]
    );

    res.json({ ...lastRunStats, runLog, linkedInScraped, linkedInErrors });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/workflows/competitor/score ──────────────────────────────────────

const SCORING_PROMPT = (title, content, existingTitles, topicsText) =>
  `You are a content scoring assistant for BcnCor, a Spanish startup advisory firm specialising in CFO services, startup funding, and strategic consulting.

Score this competitor blog article. Return ONLY a raw JSON object — no markdown, no explanation.

SCORING DIMENSIONS:
- strategic (0–3): Alignment with priority topics (${topicsText})
  3 = Direct match to a priority topic | 2 = Adjacent or partial match | 1 = Loosely related | 0 = Not relevant
- intent (0–2): Buyer intent for startup founders
  2 = Decision/action stage (hiring CFO, raising a round, due diligence, valuation) | 1 = Awareness/consideration | 0 = No founder focus
- seo (0–2): SEO potential in Spain
  2 = High-demand keyword with ranking opportunity | 1 = Moderate demand or niche | 0 = No clear SEO value

BCNCOR'S EXISTING BLOG TITLES (use for gap analysis):
- ${existingTitles}

- gap (−1, 0, or 1): Does BcnCor already cover this topic?
  1 = Not covered in existing blog | 0 = Partially covered | −1 = Already covered well

ARTICLE:
Title: ${title}
Content: ${content}

Return exactly this JSON (integers only, gap can be -1/0/1):
{"strategic":0,"intent":0,"seo":0,"gap":0}`;

const LINKEDIN_SCORING_PROMPT = (title, content, likes, comments, shares, existingTitles, topicsText) =>
  `You are a content scoring assistant for BcnCor, a Spanish startup advisory firm specialising in CFO services, startup funding, and strategic consulting.

Score this competitor LinkedIn post. Return ONLY a raw JSON object — no markdown, no explanation.

SCORING DIMENSIONS:
- strategic (0–3): Alignment with priority topics (${topicsText})
  3 = Direct match | 2 = Adjacent or partial match | 1 = Loosely related | 0 = Not relevant
- intent (0–2): Buyer intent for startup founders
  2 = Decision/action stage (hiring CFO, raising a round, due diligence, valuation) | 1 = Awareness/consideration | 0 = No founder focus
- engagement (0–2): Social engagement signals
  2 = High (likes+comments+shares > 50) | 1 = Moderate (10–50) | 0 = Low (<10)

BCNCOR'S EXISTING BLOG TITLES (use for gap analysis):
- ${existingTitles}

- gap (−1, 0, or 1): Does BcnCor already cover this topic?
  1 = Not covered in existing blog | 0 = Partially covered | −1 = Already covered well

POST:
Title: ${title}
Content: ${content}
Engagement: ${likes} likes, ${comments} comments, ${shares} shares

Return exactly this JSON (integers only, gap can be -1/0/1):
{"strategic":0,"intent":0,"engagement":0,"gap":0}`;

const INSTAGRAM_SCORING_PROMPT = (content, likes, comments, existingTitles, topicsText) =>
  `You are a content scoring assistant for BcnCor, a Spanish startup advisory firm specialising in CFO services, startup funding, and strategic consulting.

Score this competitor Instagram post. Return ONLY a raw JSON object — no markdown, no explanation.

SCORING DIMENSIONS:
- strategic (0–3): Alignment with priority topics (${topicsText})
  3 = Direct match | 2 = Adjacent or partial match | 1 = Loosely related | 0 = Not relevant
- intent (0–2): Buyer intent for startup founders
  2 = Decision/action stage | 1 = Awareness/consideration | 0 = No founder focus
- engagement (0–2): Social engagement signals
  2 = High (likes+comments > 50) | 1 = Moderate (10–50) | 0 = Low (<10)

BCNCOR'S EXISTING BLOG TITLES (use for gap analysis):
- ${existingTitles}

- gap (−1, 0, or 1): Does BcnCor already cover this topic?
  1 = Not covered in existing blog | 0 = Partially covered | −1 = Already covered well

POST:
Content: ${content}
Engagement: ${likes} likes, ${comments} comments

Return exactly this JSON (integers only, gap can be -1/0/1):
{"strategic":0,"intent":0,"engagement":0,"gap":0}`;

function calcPriority(score, thresholds) {
  for (const t of thresholds) {
    if (score >= t.min_points) return t.label.split(' ')[0].toLowerCase();
  }
  return 'low';
}

async function scoreAll(req, res, next) {
  try {
    const limit = parseInt(req.body?.limit, 10) || 10;
    const apiKey = await getAnthropicKey();
    const client = new Anthropic({ apiKey });
    let scored = 0;

    const { rows: existingBlog } = await db.query('SELECT title FROM blog_articles ORDER BY scraped_at DESC LIMIT 100');
    const existingTitles = existingBlog.map(r => r.title).filter(Boolean).join('\n- ') || '(none yet)';

    // Load dynamic scoring config from DB
    const { rows: topicsRows } = await db.query('SELECT name, tier, keywords FROM topics ORDER BY sort_order');
    const topicsText = topicsRows.length > 0
      ? topicsRows.map(t => `${t.name} (${t.tier}): ${(t.keywords || []).join(', ')}`).join(' | ')
      : 'seed funding Spain, CFO services, investor relations, startup growth, accelerators, financial modelling';

    const { rows: threshRows } = await db.query('SELECT * FROM thresholds ORDER BY min_points DESC');

    // Fill the batch: articles first, then LinkedIn, then Instagram
    const { rows: batchArticles } = await db.query(
      'SELECT * FROM competitor_articles WHERE score IS NULL LIMIT $1', [limit]
    );
    let budget = limit - batchArticles.length;
    const { rows: batchLI } = budget > 0
      ? await db.query('SELECT * FROM linkedin_posts WHERE score IS NULL LIMIT $1', [budget])
      : { rows: [] };
    budget -= batchLI.length;
    const { rows: batchIG } = budget > 0
      ? await db.query('SELECT * FROM instagram_posts WHERE score IS NULL LIMIT $1', [budget])
      : { rows: [] };

    // ── Score blog articles ──
    for (const article of batchArticles) {
      try {
        const content = (article.content_text || article.excerpt || '').slice(0, 3000);
        if (!article.title && !content) continue;
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001', max_tokens: 80,
          messages: [{ role: 'user', content: SCORING_PROMPT(article.title, content, existingTitles, topicsText) }],
        });
        const raw = msg.content[0].text.trim().replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
        const dims = JSON.parse(raw);
        const total = (dims.strategic || 0) + (dims.intent || 0) + (dims.seo || 0) + (dims.gap || 0);
        const priority = calcPriority(total, threshRows);
        await db.query(
          `UPDATE competitor_articles SET score=$1, priority=$2, dim_strategic=$3, dim_intent=$4, dim_seo=$5, dim_gap=$6 WHERE id=$7`,
          [total, priority, dims.strategic, dims.intent, dims.seo, dims.gap, article.id]
        );
        scored++;
      } catch (e) { console.error(`Blog score failed ${article.id}: ${e.message}`); }
    }

    // ── Score LinkedIn posts ──
    for (const post of batchLI) {
      try {
        const content = (post.content || post.title || '').slice(0, 3000);
        if (!content) continue;
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001', max_tokens: 80,
          messages: [{ role: 'user', content: LINKEDIN_SCORING_PROMPT(post.title || '', content, post.likes || 0, post.comments || 0, post.shares || 0, existingTitles, topicsText) }],
        });
        const raw = msg.content[0].text.trim().replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
        const dims = JSON.parse(raw);
        const total = (dims.strategic || 0) + (dims.intent || 0) + (dims.engagement || 0) + (dims.gap || 0);
        const priority = calcPriority(total, threshRows);
        await db.query(
          `UPDATE linkedin_posts SET score=$1, priority=$2, dim_strategic=$3, dim_intent=$4, dim_engagement=$5, dim_gap=$6 WHERE id=$7`,
          [total, priority, dims.strategic, dims.intent, dims.engagement, dims.gap, post.id]
        );
        scored++;
      } catch (e) { console.error(`LinkedIn score failed ${post.id}: ${e.message}`); }
    }

    // ── Score Instagram posts ──
    for (const post of batchIG) {
      try {
        const content = (post.content || '').slice(0, 3000);
        if (!content) continue;
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001', max_tokens: 80,
          messages: [{ role: 'user', content: INSTAGRAM_SCORING_PROMPT(content, post.likes || 0, post.comments || 0, existingTitles, topicsText) }],
        });
        const raw = msg.content[0].text.trim().replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
        const dims = JSON.parse(raw);
        const total = (dims.strategic || 0) + (dims.intent || 0) + (dims.engagement || 0) + (dims.gap || 0);
        const priority = calcPriority(total, threshRows);
        await db.query(
          `UPDATE instagram_posts SET score=$1, priority=$2, dim_strategic=$3, dim_intent=$4, dim_engagement=$5, dim_gap=$6 WHERE id=$7`,
          [total, priority, dims.strategic, dims.intent, dims.engagement, dims.gap, post.id]
        );
        scored++;
      } catch (e) { console.error(`Instagram score failed ${post.id}: ${e.message}`); }
    }

    // Count remaining unscored items across all tables
    const [ra, rl, ri] = await Promise.all([
      db.query('SELECT COUNT(*) FROM competitor_articles WHERE score IS NULL'),
      db.query('SELECT COUNT(*) FROM linkedin_posts WHERE score IS NULL'),
      db.query('SELECT COUNT(*) FROM instagram_posts WHERE score IS NULL'),
    ]);
    const remaining = parseInt(ra.rows[0].count) + parseInt(rl.rows[0].count) + parseInt(ri.rows[0].count);

    res.json({ scored, remaining });
  } catch (err) { next(err); }
}

// ── POST /api/workflows/competitor/articles/:articleId/send-to-inbox ──────────

async function sendToInbox(req, res, next) {
  try {
    const { articleId } = req.params;
    const { rows } = await db.query('SELECT * FROM competitor_articles WHERE id = $1', [articleId]);
    const article = rows[0];

    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    if (article.sent_to_inbox) {
      return res.status(409).json({ message: 'Article already sent to inbox.' });
    }

    const inboxItem = {
      id:        Date.now() + Math.random(),
      source:    'competitor',
      url:       article.url,
      title:     article.title,
      status:    'pending',
      date:      new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      content:   { linkedin: '', instagram: '', slides: [], hashtags: '', cta: '', qa_notes: '' },
      slides:    [],
      tags:      ['Competitor', article.competitor_name],
      excerpt:   article.excerpt,
      createdAt: new Date().toISOString(),
    };

    inboxItems.push(inboxItem);
    await db.query('UPDATE competitor_articles SET sent_to_inbox = true WHERE id = $1', [articleId]);

    res.json({ inboxItemId: inboxItem.id });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/workflows/competitor/linkedin-posts ──────────────────────────────

async function getLinkedInPosts(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM linkedin_posts ORDER BY date DESC');
    const mapped = rows.map(r => ({
      id:           r.id,
      channel:      r.channel,
      source:       r.source,
      competitor:   r.competitor,
      competitorId: r.competitor_id,
      title:        r.title,
      content:      r.content,
      url:          r.url,
      date:         r.date,
      isRepost:     r.is_repost,
      repostedFrom: r.reposted_from,
      imageUrl:     r.image_url,
      videoUrl:     r.video_url,
      articleTitle: r.article_title,
      articleUrl:   r.article_url,
      engagement: {
        likes:    r.likes,
        comments: r.comments,
        shares:   r.shares,
      },
      score:     r.score,
      priority:  r.priority,
      dimensions: {
        strategic:  r.dim_strategic,
        intent:     r.dim_intent,
        engagement: r.dim_engagement,
        gap:        r.dim_gap,
      },
      status:    r.status,
      createdAt: r.created_at,
    }));
    res.json({ posts: mapped });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/workflows/competitor/instagram-posts ────────────────────────────

async function getInstagramPosts(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM instagram_posts ORDER BY posted_at DESC, scraped_at DESC');
    const mapped = rows.map(r => ({
      id:           r.id,
      competitor:   r.competitor,
      competitorId: r.competitor_id,
      content:      r.content,
      url:          r.url,
      imageUrl:     r.image_url,
      postType:     r.post_type,
      date:         r.posted_at,
      engagement: {
        likes:    r.likes,
        comments: r.comments,
      },
      score:     r.score,
      priority:  r.priority,
      dimensions: {
        strategic:  r.dim_strategic,
        intent:     r.dim_intent,
        engagement: r.dim_engagement,
        gap:        r.dim_gap,
      },
      scrapedAt: r.scraped_at,
    }));
    res.json({ posts: mapped });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/workflows/competitor/auto-draft ─────────────────────────────────
// Finds high-priority items not yet in blog_drafts and generates drafts for them.

async function autoDraft(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.body?.limit, 10) || 3, 10);
    const lookbackDays = Math.max(1, parseInt(req.body?.lookback_days, 10) || 7);

    const { rows: existingRows } = await db.query(
      'SELECT source_url FROM blog_drafts WHERE source_url IS NOT NULL'
    );
    const existingUrls = new Set(existingRows.map(r => r.source_url));

    const [{ rows: articles }, { rows: liPosts }, { rows: igPosts }] = await Promise.all([
      db.query(`SELECT url, title, competitor_name AS competitor, competitor_id, score FROM competitor_articles WHERE priority = 'high' AND scraped_at >= NOW() - INTERVAL '${lookbackDays} days'`),
      db.query(`SELECT url, title, competitor, competitor_id, score FROM linkedin_posts WHERE priority = 'high' AND created_at >= NOW() - INTERVAL '${lookbackDays} days'`),
      db.query(`SELECT url, content, competitor, competitor_id, score FROM instagram_posts WHERE priority = 'high' AND scraped_at >= NOW() - INTERVAL '${lookbackDays} days'`),
    ]);

    const candidates = [
      ...articles.map(r => ({ url: r.url, title: r.title, competitor: r.competitor, competitor_id: r.competitor_id, score: r.score })),
      ...liPosts.map(r => ({ url: r.url, title: r.title, competitor: r.competitor, competitor_id: r.competitor_id, score: r.score })),
      ...igPosts.map(r => ({ url: r.url, title: (r.content || '').slice(0, 120), competitor: r.competitor, competitor_id: r.competitor_id, score: r.score })),
    ].filter(item => item.url && !existingUrls.has(item.url)).slice(0, limit);

    // Create draft records first (fast DB writes only)
    const created = [];
    for (const item of candidates) {
      try {
        let draftId = null;
        await createDraft(
          { body: { url: item.url, title: item.title, competitor: item.competitor, competitor_id: item.competitor_id, score: item.score, ai_generated: true } },
          { json: (data) => { draftId = data.draft?.id ?? null; }, status: () => ({ json: () => {} }) },
          (err) => { throw err; }
        );
        if (draftId) created.push({ draftId, item });
      } catch (err) {
        console.error(`autoDraft create error for ${item.url}: ${err.message}`);
      }
    }

    // Respond immediately — generation runs in background
    res.json({ drafted: created.length, generating: created.length > 0 });

    // Fire-and-forget: generate each draft without blocking the response
    for (const { draftId, item } of created) {
      generateDraft(
        { params: { id: String(draftId) }, body: {} },
        { json: () => {}, status: () => ({ json: () => {} }) },
        (err) => console.error(`autoDraft generate error for ${item.url}: ${err.message}`)
      ).catch(err => console.error(`autoDraft generate error for ${item.url}: ${err.message}`));
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { sources, articles, status, run, scoreAll, sendToInbox, getLinkedInPosts, getInstagramPosts, autoDraft };
