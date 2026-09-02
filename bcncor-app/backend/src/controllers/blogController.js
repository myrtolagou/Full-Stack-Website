/**
 * controllers/blogController.js
 *
 * Handles the Blog workflow endpoints:
 *  GET  /api/workflows/blog/preview    → scrape article list, mark new vs seen
 *  POST /api/workflows/blog/run        → process selected articles through Claude
 *  GET  /api/workflows/blog/status     → last run time and stats
 *  GET  /api/workflows/blog/inbox      → generated items for this workflow
 *  POST /api/workflows/blog/generate   → generate/regenerate slides for a single item
 *  GET  /api/workflows/blog/carousels  → all saved carousels
 */

const scraperService = require('../services/scraperService');
const { generateContent, DEFAULT_TEMPLATE } = require('../services/claudeService');
const db = require('../config/db');

db.query(`
  CREATE TABLE IF NOT EXISTS blog_articles (
    id          TEXT          PRIMARY KEY,
    url         TEXT          NOT NULL UNIQUE,
    title       TEXT,
    publish_date DATE,
    excerpt     TEXT,
    scraped_at  TIMESTAMPTZ   DEFAULT NOW()
  )
`).catch(err => console.error('[blog_articles] table init error:', err));

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Converts scraper date "M/D/YY" → ISO "YYYY-MM-DD" for PostgreSQL DATE column.
function toIsoDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts;
  const year  = 2000 + parseInt(y, 10);
  const month = parseInt(m, 10);
  const day   = parseInt(d, 10);
  if (!year || !month || !day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Normalise a pg DATE value to "YYYY-MM-DD" regardless of whether pg returned
// a Date object or a string (depends on column type and pg version).
function fmtDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).split('T')[0];
}

// ── Shared helper: annotate articles with seen/new status ─────────────────────

async function annotateAndReturn(articles, res) {
  const seen = await db.query('SELECT url FROM blog_inbox_items');
  const seenUrls = new Set(seen.rows.map(r => r.url));
  const annotated = articles.map(a => ({ ...a, status: seenUrls.has(a.url) ? 'seen' : 'new' }));
  res.json({ articles: annotated });
}

// ── GET /api/workflows/blog/preview ───────────────────────────────────────────
// Returns cached rows from blog_articles if available, otherwise scrapes and caches.

async function preview(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM blog_articles ORDER BY publish_date DESC');

    if (rows.length > 0) {
      const articles = rows.map(r => ({
        id:          r.id,
        url:         r.url,
        title:       r.title,
        publishDate: fmtDate(r.publish_date),
        excerpt:     r.excerpt,
        scrapedAt:   r.scraped_at,
      }));
      return annotateAndReturn(articles, res);
    }

    // Table empty — scrape and populate
    const scraped = await scraperService.scrapeArticleList();
    for (const a of scraped) {
      const id = generateId();
      await db.query(
        `INSERT INTO blog_articles (id, url, title, publish_date, excerpt)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (url) DO NOTHING`,
        [id, a.url, a.title || null, toIsoDate(a.date), a.summary || null]
      );
    }
    return annotateAndReturn(scraped, res);
  } catch (err) {
    next(err);
  }
}

// ── POST /api/workflows/blog/refresh ─────────────────────────────────────────
// Forces a re-scrape and upserts results into blog_articles.

async function refresh(_req, res, next) {
  try {
    const scraped = await scraperService.scrapeArticleList();

    const { rows: existingRows } = await db.query('SELECT url FROM blog_articles');
    const existingUrls = new Set(existingRows.map(r => r.url));
    const fresh = scraped.filter(a => !existingUrls.has(a.url));

    let upserted = 0;
    for (const a of fresh) {
      const id = generateId();
      await db.query(
        `INSERT INTO blog_articles (id, url, title, publish_date, excerpt, scraped_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (url) DO NOTHING`,
        [id, a.url, a.title || null, toIsoDate(a.date), a.summary || null]
      );
      upserted++;
    }
    console.log(`[blog/refresh] ${scraped.length} scraped, ${fresh.length} new, ${existingUrls.size} already in DB`);

    const { rows } = await db.query('SELECT * FROM blog_articles ORDER BY publish_date DESC');
    const articles = rows.map(r => ({
      id:          r.id,
      url:         r.url,
      title:       r.title,
      publishDate: r.publish_date,
      excerpt:     r.excerpt,
      scrapedAt:   r.scraped_at,
    }));

    const seenRes = await db.query('SELECT url FROM blog_inbox_items');
    const seenUrls = new Set(seenRes.rows.map(r => r.url));
    const annotated = articles.map(a => ({ ...a, status: seenUrls.has(a.url) ? 'seen' : 'new' }));

    res.json({ articles: annotated, upserted });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/workflows/blog/run ──────────────────────────────────────────────

async function run(req, res, next) {
  try {
    const { urls } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ message: 'No articles selected.' });
    }

    const seen = await db.query('SELECT url FROM blog_inbox_items');
    const seenUrls = new Set(seen.rows.map(r => r.url));

    const results = [];
    const errors  = [];

    for (const url of urls) {
      try {
        if (seenUrls.has(url)) continue;

        const { title, fullText } = await scraperService.scrapeArticleFullText(url);

        if (!fullText || fullText.length < 100) {
          errors.push({ url, reason: 'Could not extract enough text from article' });
          continue;
        }

        const id      = generateId();
        const excerpt = fullText.slice(0, 200) + '…';

        const { rows: artRows } = await db.query('SELECT publish_date FROM blog_articles WHERE url = $1', [url]);
        const publishDate = artRows[0]?.publish_date;
        const date = publishDate
          ? new Date(publishDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

        await db.query(
          `INSERT INTO blog_inbox_items (id, source, url, title, status, date, excerpt, full_text, tags, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           ON CONFLICT (id) DO NOTHING`,
          [id, 'blog', url, title, 'pending', date, excerpt, fullText, JSON.stringify(['Blog'])]
        );

        const carouselId = generateId();
        await db.query(
          `INSERT INTO blog_carousels (id, inbox_item_id, source, title, url, slides, date, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [carouselId, id, 'blog', title, url, JSON.stringify([]), date, 'pending']
        );

        seenUrls.add(url);
        results.push({ id, url, title });
      } catch (articleErr) {
        errors.push({ url, reason: articleErr.message });
      }
    }

    res.json({
      queued:  results.length,
      errors,
      lastRun: { at: new Date().toISOString(), stats: { scraped: urls.length, queued: results.length, errors: errors.length } },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/workflows/blog/status ────────────────────────────────────────────

async function status(_req, res, next) {
  try {
    const result = await db.query('SELECT MAX(scraped_at) as last_run FROM blog_articles');
    const lastRun = result.rows[0]?.last_run || null;
    res.json({ lastRun, inboxCount: 0, seenCount: 0 });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/workflows/blog/inbox ─────────────────────────────────────────────

async function inbox(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM blog_inbox_items ORDER BY created_at DESC');
    const items = rows.map(r => ({
      id:        r.id,
      source:    r.source,
      url:       r.url,
      title:     r.title,
      status:    r.status,
      date:      r.date,
      excerpt:   r.excerpt,
      fullText:  r.full_text,
      tags:      r.tags,
      slides:    r.slides || [],
      doneDate:  r.done_date,
      createdAt: r.created_at,
    }));
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/workflows/blog/generate ─────────────────────────────────────────

async function generate(req, res, next) {
  try {
    const { inboxItemId, url, title: providedTitle, template } = req.body;

    if (!url) return res.status(400).json({ message: 'url is required.' });

    const slideTemplate = Array.isArray(template) && template.length > 0 ? template : DEFAULT_TEMPLATE;

    // Use stored fullText if available, otherwise re-scrape
    let title, fullText;
    const { rows } = await db.query('SELECT * FROM blog_inbox_items WHERE id = $1', [String(inboxItemId)]);
    const existingItem = rows[0];

    if (existingItem && existingItem.full_text && existingItem.full_text.length > 100) {
      title    = existingItem.title;
      fullText = existingItem.full_text;
    } else {
      const scraped = await scraperService.scrapeArticleFullText(url);
      title    = scraped.title;
      fullText = scraped.fullText;
    }

    if (!fullText || fullText.length < 100) {
      return res.status(422).json({ message: 'Could not extract enough text from article.' });
    }

    const content = await generateContent(title || providedTitle, fullText, slideTemplate);
    const slides  = content.slides || [];

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    // Update inbox item
    await db.query(
      `UPDATE blog_inbox_items SET slides = $1, status = 'done', done_date = $2, title = $3 WHERE id = $4`,
      [JSON.stringify(slides), today, title || providedTitle, String(inboxItemId)]
    );

    // Upsert carousel
    const carouselId = generateId();
    await db.query(
      `INSERT INTO blog_carousels (id, inbox_item_id, source, title, url, slides, date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (inbox_item_id) DO UPDATE SET slides = EXCLUDED.slides, title = EXCLUDED.title`,
      [carouselId, String(inboxItemId), 'blog', title || providedTitle, url, JSON.stringify(slides), today, 'pending']
    );

    // Fetch the actual id that was upserted (may differ on conflict)
    const { rows: carouselRows } = await db.query(
      'SELECT id FROM blog_carousels WHERE inbox_item_id = $1',
      [String(inboxItemId)]
    );

    res.json({ slides, carouselId: carouselRows[0]?.id ?? carouselId, title: title || providedTitle, doneDate: today });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/workflows/blog/carousels ─────────────────────────────────────────

async function listCarousels(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM blog_carousels ORDER BY created_at DESC');
    const carousels = rows.map(r => ({
      id:          r.id,
      inboxItemId: r.inbox_item_id,
      source:      r.source,
      title:       r.title,
      url:         r.url,
      slides:      r.slides || [],
      date:        r.date,
      status:      r.status || 'pending',
      createdAt:   r.created_at,
    }));
    res.json({ carousels });
  } catch (err) {
    next(err);
  }
}

module.exports = { preview, refresh, run, status, inbox, generate, listCarousels };
