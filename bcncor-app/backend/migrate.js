require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dataDir = path.join(__dirname, 'data');

async function migrateArticles() {
  const articles = JSON.parse(fs.readFileSync(path.join(dataDir, 'competitor-articles.json'), 'utf8'));
  let inserted = 0;

  for (const a of articles) {
    await pool.query(
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
        a.dimensions?.strategic, a.dimensions?.intent,
        a.dimensions?.seo, a.dimensions?.gap,
      ]
    );
    inserted++;
  }

  console.log(`competitor_articles: ${inserted} rows processed (duplicates skipped)`);
}

async function migratePosts() {
  const posts = JSON.parse(fs.readFileSync(path.join(dataDir, 'linkedin-posts.json'), 'utf8'));
  let inserted = 0;

  for (const p of posts) {
    await pool.query(
      `INSERT INTO linkedin_posts
        (id, channel, source, competitor, competitor_id, title, content, url, date,
         is_repost, reposted_from, image_url, video_url, article_title, article_url,
         likes, comments, shares, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (id) DO NOTHING`,
      [
        p.id, p.channel, p.source, p.competitor, p.competitorId,
        p.title, p.content, p.url, p.date,
        p.isRepost, p.repostedFrom, p.imageUrl, p.videoUrl,
        p.articleTitle, p.articleUrl,
        p.engagement?.likes, p.engagement?.comments, p.engagement?.shares,
        p.status, p.createdAt,
      ]
    );
    inserted++;
  }

  console.log(`linkedin_posts: ${inserted} rows processed (duplicates skipped)`);
}

async function migrateScraperRun() {
  const meta = JSON.parse(fs.readFileSync(path.join(dataDir, 'competitor-meta.json'), 'utf8'));

  const linkedInEntry = (meta.runLog || []).find(e => e.text?.includes('LinkedIn:'));
  const linkedInCount = linkedInEntry
    ? parseInt(linkedInEntry.text.match(/\d+/)?.[0] ?? '0', 10)
    : 0;

  await pool.query(
    `INSERT INTO scraper_runs
      (run_at, competitors_scraped, articles_found, linkedin_posts_scraped, run_log)
     VALUES ($1,$2,$3,$4,$5)`,
    [
      meta.lastRunStats.runAt,
      meta.lastRunStats.competitorsScraped,
      meta.lastRunStats.articlesFound,
      linkedInCount,
      JSON.stringify(meta.runLog),
    ]
  );

  console.log(`scraper_runs: 1 run inserted (linkedin_posts_scraped: ${linkedInCount})`);
}

async function main() {
  try {
    console.log('Starting migration…\n');
    await migrateArticles();
    await migratePosts();
    await migrateScraperRun();
    console.log('\nMigration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
