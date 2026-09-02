const db = require('../config/db');

// Add status column to existing table if missing
db.query(`ALTER TABLE blog_carousels ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`)
  .catch(err => console.error('[blog_carousels] alter table error:', err));

async function list(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM blog_carousels ORDER BY created_at DESC');
    const carousels = rows.map(r => ({
      id:          r.id,
      inboxItemId: r.inbox_item_id,
      source:      r.source || 'blog',
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

async function patchStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['pending', 'approved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const { rows } = await db.query(
      'UPDATE blog_carousels SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ carousel: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function patchSlides(req, res, next) {
  try {
    const { slides } = req.body;
    const { rows } = await db.query(
      'UPDATE blog_carousels SET slides = $1 WHERE id = $2 RETURNING id, slides',
      [JSON.stringify(slides), req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ carousel: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await db.query('DELETE FROM blog_carousels WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, patchStatus, patchSlides, remove };
