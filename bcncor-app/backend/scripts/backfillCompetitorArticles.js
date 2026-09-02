/**
 * scripts/backfillCompetitor 6Competitor 4.js
 *
 * One-time backfill: fetches articles from Competitor 6 and Competitor 4 via their
 * WP REST APIs using curl (their CDN blocks Node.js TLS fingerprints).
 *
 * Run with: node scripts/backfillCompetitor 6Competitor 4.js
 */

const { execSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');

const DATA_DIR      = path.join(__dirname, '../data');
const ARTICLES_FILE = path.join(DATA_DIR, 'competitor-articles.json');

const COMPETITORS = [
  { id: 'competitor-6', name: 'Competitor 6', wpApiBase: 'https://www.competitor6.example.com/wp-json/wp/v2' },
  { id: 'competitor-4',   name: 'Competitor 4',   wpApiBase: 'https://competitor4.example.com/wp-json/wp/v2' },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function curlGet(url) {
  const result = execSync(
    `curl -s --max-time 15 -H "Accept: application/json" "${url}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  return JSON.parse(result);
}

function fetchWpArticles(competitor) {
  const url   = `${competitor.wpApiBase}/posts?per_page=10&_fields=id,title,link,date,excerpt`;
  const posts = curlGet(url);
  return posts.map(post => ({
    id:             generateId(),
    competitorId:   competitor.id,
    competitorName: competitor.name,
    url:            post.link,
    title:          (post.title?.rendered || post.link).replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c))),
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

async function main() {
  let existing = [];
  try {
    if (fs.existsSync(ARTICLES_FILE)) {
      existing = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
      console.log(`Loaded ${existing.length} existing articles from disk.`);
    }
  } catch (e) {
    console.warn(`Could not load existing articles: ${e.message}`);
  }

  const newArticles = [];

  for (const competitor of COMPETITORS) {
    console.log(`\nFetching ${competitor.name} via WP API (curl)...`);
    try {
      const articles = fetchWpArticles(competitor);
      console.log(`  Got ${articles.length} articles`);
      for (const article of articles) {
        if (existing.some(a => a.url === article.url)) {
          console.log(`  Skipping (already saved): ${article.url}`);
          continue;
        }
        newArticles.push(article);
        console.log(`  + "${article.title.slice(0, 70)}"`);
      }
    } catch (err) {
      console.error(`  Failed for ${competitor.name}: ${err.message}`);
    }
  }

  if (newArticles.length === 0) {
    console.log('\nNo new articles found. Nothing to save.');
    return;
  }

  const merged = [...existing, ...newArticles];
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(merged, null, 2), 'utf8');

  console.log(`\nDone. Added ${newArticles.length} new articles.`);
  console.log(`Total articles saved: ${merged.length}`);
}

main().catch(err => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
