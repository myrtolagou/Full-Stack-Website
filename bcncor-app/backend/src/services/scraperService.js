/**
 * services/scraperService.js
 *
 * Scrapes BcnCor's blog (bcncor.com/es/novedades) to extract
 * article metadata and full text content.
 *
 * Exported functions:
 *  scrapeArticleList()         → [{ url, title, date, summary }]
 *  scrapeArticleFullText(url)  → string
 */

const axios   = require('axios');
const cheerio = require('cheerio');

const BASE_URL     = 'https://www.bcncor.com';
const NOVEDADES_URL = `${BASE_URL}/es/novedades`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&#\d+;/g, '');
}

function cleanText(str) {
  return decodeHtmlEntities(str)
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveUrl(href) {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  return BASE_URL + (href.startsWith('/') ? href : '/' + href);
}

// ── Scrape article list from novedades (all pages) ───────────────────────────

async function scrapeArticleList() {
  const byUrl = new Map(); // url -> { title, date }

  function extractFromPage(html) {
    const $ = cheerio.load(html);
    const found = [];

    $('a[href*="/es/post/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href || href.includes('#')) return;

      const url = resolveUrl(href);
      if (!url) return;

      const fullText = cleanText($(el).text());
      const dateMatch = fullText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      const date = dateMatch ? dateMatch[1] : '';

      const headingText = cleanText($(el).find('h1,h2,h3,h4').first().text());
      const candidate = headingText.length > 5 ? headingText : fullText;

      const existing = byUrl.get(url);
      if (!existing || candidate.length > existing.title.length) {
        byUrl.set(url, { title: candidate.slice(0, 150).trim(), date: date || existing?.date || '' });
      } else if (date && !existing.date) {
        existing.date = date;
      }

      found.push(url);
    });

    return found;
  }

  // Page 1
  console.log(`[scraper] Fetching page 1: ${NOVEDADES_URL}`);
  let firstHtml;
  try {
    const { data } = await axios.get(NOVEDADES_URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BcnCorBot/1.0)' },
    });
    firstHtml = data;
  } catch (err) {
    console.error(`[scraper] Page 1 FAILED`);
    console.error(`[scraper]   message: ${err.message}`);
    console.error(`[scraper]   status:  ${err.response?.status ?? 'no response'}`);
    console.error(`[scraper]   headers: ${JSON.stringify(err.response?.headers ?? {})}`);
    console.error(`[scraper]   url:     ${NOVEDADES_URL}`);
    throw err;
  }
  extractFromPage(firstHtml);
  console.log(`[scraper] Page 1: ${byUrl.size} articles found so far`);

  // Pages 2, 3, … — Webflow query param pagination
  let page = 2;
  while (true) {
    const pageUrl = `${NOVEDADES_URL}?8b30a8f1_page=${page}`;
    console.log(`[scraper] Fetching page ${page}: ${pageUrl}`);
    let html;
    try {
      const { data } = await axios.get(pageUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BcnCorBot/1.0)' },
      });
      html = data;
    } catch (err) {
      console.log(`[scraper] Page ${page} failed (${err.message}) — stopping`);
      break;
    }

    const sizeBefore = byUrl.size;
    extractFromPage(html);
    const newCount = byUrl.size - sizeBefore;
    console.log(`[scraper] Page ${page}: ${newCount} new articles (${byUrl.size} total)`);
    if (newCount === 0) break;

    page++;
  }

  console.log(`[scraper] Done — ${byUrl.size} articles across ${page - 1} page(s)`);

  const articles = [];
  for (const [url, { title: rawTitle, date }] of byUrl) {
    const slug = url.split('/es/post/')[1]?.replace(/-/g, ' ') || '';
    const title = rawTitle.length >= 10 ? rawTitle : slug;
    articles.push({ url, title, date, summary: '' });
  }

  return articles;
}

// ── Scrape full text of a single article ─────────────────────────────────────

async function scrapeArticleFullText(url) {
  const { data: html } = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BcnCorBot/1.0)' },
  });

  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, nav, header, footer, [class*="menu"], [class*="sidebar"], [class*="widget"], iframe, noscript').remove();

  // Extract title
  const title = cleanText($('h1').first().text()) ||
                cleanText($('title').text());

  // Extract main content — try article selectors first
  let contentText = '';
  const contentEl = $('article, .post-content, .entry-content, [class*="content"], main').first();

  if (contentEl.length) {
    contentText = cleanText(contentEl.text());
  } else {
    // Fallback: grab all paragraph text from body
    const parts = [];
    $('body p').each((_, el) => {
      const t = cleanText($(el).text());
      if (t.length > 40) parts.push(t);
    });
    contentText = parts.join('\n\n');
  }

  return { title, fullText: contentText.slice(0, 12000) };
}

module.exports = { scrapeArticleList, scrapeArticleFullText };