const db = require('../config/db');
const { scrapeOwnLinkedInPosts, scrapeOwnInstagramPosts } = require('../services/apifyService');

db.query(`
  CREATE TABLE IF NOT EXISTS own_linkedin_posts (
    id         TEXT PRIMARY KEY,
    title      TEXT,
    content    TEXT,
    url        TEXT,
    date       DATE,
    image_url  TEXT,
    video_url  TEXT,
    likes      INTEGER DEFAULT 0,
    comments   INTEGER DEFAULT 0,
    shares     INTEGER DEFAULT 0,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(err => console.error('[own_linkedin_posts] table init error:', err));

db.query(`
  CREATE TABLE IF NOT EXISTS own_instagram_posts (
    id         TEXT PRIMARY KEY,
    content    TEXT,
    url        TEXT,
    image_url  TEXT,
    video_url  TEXT,
    post_type  TEXT,
    likes      INTEGER DEFAULT 0,
    comments   INTEGER DEFAULT 0,
    posted_at  TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(err => console.error('[own_instagram_posts] table init error:', err));

exports.run = async (req, res, next) => {
  try {
    const [liPosts, igPosts] = await Promise.all([
      scrapeOwnLinkedInPosts(50),
      scrapeOwnInstagramPosts(50),
    ]);

    let liInserted = 0;
    for (const p of liPosts) {
      const result = await db.query(
        `INSERT INTO own_linkedin_posts (id, title, content, url, date, image_url, video_url, likes, comments, shares)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.title, p.content, p.url, p.date || null, p.imageUrl, p.videoUrl,
         p.engagement?.likes ?? 0, p.engagement?.comments ?? 0, p.engagement?.shares ?? 0]
      );
      if (result.rowCount > 0) liInserted++;
    }

    let igInserted = 0;
    for (const p of igPosts) {
      const result = await db.query(
        `INSERT INTO own_instagram_posts (id, content, url, image_url, video_url, post_type, likes, comments, posted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.content, p.url, p.imageUrl, p.videoUrl, p.postType,
         p.likes ?? 0, p.comments ?? 0, p.date || null]
      );
      if (result.rowCount > 0) igInserted++;
    }

    console.log(`[own-content/run] LinkedIn: ${liInserted}/${liPosts.length} inserted — Instagram: ${igInserted}/${igPosts.length} inserted`);

    res.json({
      linkedinScraped:  liInserted,
      instagramScraped: igInserted,
    });
  } catch (err) {
    next(err);
  }
};

exports.getLinkedInPosts = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM own_linkedin_posts ORDER BY date DESC');
    res.json({ posts: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getInstagramPosts = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM own_instagram_posts ORDER BY posted_at DESC');
    res.json({ posts: result.rows });
  } catch (err) {
    next(err);
  }
};
