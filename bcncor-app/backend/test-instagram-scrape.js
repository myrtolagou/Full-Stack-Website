/**
 * One-off test: scrape 1 Instagram post for Competitor 6 and log the result.
 * Run from the backend/ directory:
 *   node test-instagram-scrape.js
 */
require('dotenv').config();

const db                     = require('./src/config/db');
const { scrapeInstagramPosts } = require('./src/services/apifyService');

function toSlug(name) {
  return (name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

async function main() {
  const { rows } = await db.query(
    `SELECT * FROM competitors WHERE LOWER(name) LIKE '%competitor-6%' LIMIT 1`
  );

  if (rows.length === 0) {
    console.error('Competitor 6 not found in competitors table.');
    process.exit(1);
  }

  const row = rows[0];
  if (!row.instagram_id) {
    console.error(`Competitor 6 found (id=${row.id}) but instagram_id is NULL — set it first via Settings.`);
    process.exit(1);
  }

  const competitor = {
    id:              toSlug(row.name),
    name:            row.name,
    instagramHandle: row.instagram_id,
  };

  console.log(`Testing Instagram scrape for: ${competitor.name} (@${competitor.instagramHandle})`);
  console.log('maxPostsPerAccount = 1\n');

  const posts = await scrapeInstagramPosts([competitor.instagramHandle], [competitor], 1);

  console.log(`\nReturned ${posts.length} post(s):\n`);
  console.log(JSON.stringify(posts, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
