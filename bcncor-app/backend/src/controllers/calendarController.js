const db = require('../config/db');

function fmtDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

exports.getCalendar = async (req, res, next) => {
  try {
    const [blogResult, liResult, igResult] = await Promise.all([
      db.query(
        `SELECT id, title, url, publish_date AS date
         FROM blog_articles
         WHERE publish_date >= '2026-01-01'
         ORDER BY publish_date ASC`
      ),
      db.query(
        `SELECT id, title, content, url, date
         FROM own_linkedin_posts
         WHERE date >= '2026-01-01'
         ORDER BY date ASC`
      ),
      db.query(
        `SELECT id, content, url, posted_at AS date
         FROM own_instagram_posts
         WHERE posted_at >= '2026-01-01'
         ORDER BY posted_at ASC`
      ),
    ]);

    const blogArticles = blogResult.rows.map(row => ({
      id:       row.id,
      title:    row.title,
      url:      row.url,
      date:     fmtDate(row.date),
      type:     'blog',
      platform: 'Blog',
    }));

    const liPosts = liResult.rows.map(row => ({
      id:       row.id,
      title:    row.title || (row.content || '').split('\n')[0].slice(0, 80),
      url:      row.url,
      date:     fmtDate(row.date),
      type:     'linkedin',
      platform: 'LinkedIn',
    }));

    const igPosts = igResult.rows.map(row => ({
      id:       row.id,
      title:    (row.content || '').split('\n')[0].slice(0, 80),
      url:      row.url,
      date:     fmtDate(row.date),
      type:     'instagram',
      platform: 'Instagram',
    }));

    const articles = [...blogArticles, ...liPosts, ...igPosts].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });

    res.json({ articles });
  } catch (err) {
    next(err);
  }
};
