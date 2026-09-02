const db = require('../config/db');

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS competitors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      url TEXT NOT NULL,
      linkedin_id VARCHAR(100),
      wp_api_base TEXT,
      article_prefix TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  const { rows } = await db.query('SELECT COUNT(*) FROM competitors');
  if (parseInt(rows[0].count, 10) === 0) {
    const seeds = [
      ['Competitor 3',       'https://competitor3.example.com/blog/',                        'competitor-3-li',                             'https://competitor3.example.com/wp-json/wp/v2',       null],
      ['Competitor 7',       'https://www.competitor7.example.com/publications/',             'competitor-7-li',  null,                                     null],
      ['Competitor 5',  'https://competitor5.example.com/actualidad/',              'competitor-5',                          'https://competitor5.example.com/wp-json/wp/v2',   null],
      ['Competitor 1',        'https://competitor1.example.com/publicaciones/category/todo/',  'competitor-1',                               null,                                     '/publicaciones/'],
      ['Competitor 2', 'https://competitor2.example.com/blog/',                    'competitor-2-li',                     null,                                     null],
      ['Competitor 6',      'https://www.competitor6.example.com/blog/',                   'competitor-6',                             'https://www.competitor6.example.com/wp-json/wp/v2',  null],
      ['Competitor 4',        'https://competitor4.example.com/en/blog/',                      'competitor-4-li',                     'https://competitor4.example.com/wp-json/wp/v2',        null],
    ];
    for (const [name, url, linkedin_id, wp_api_base, article_prefix] of seeds) {
      await db.query(
        'INSERT INTO competitors (name, url, linkedin_id, wp_api_base, article_prefix) VALUES ($1,$2,$3,$4,$5)',
        [name, url, linkedin_id, wp_api_base, article_prefix]
      );
    }
  }
}

ensureTable().catch(err => console.error('[competitors] table init failed:', err));

async function list(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM competitors ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, url, linkedin_id, instagram_id } = req.body;
    if (!name?.trim() || !url?.trim()) {
      return res.status(400).json({ error: 'name and url are required' });
    }
    const { rows } = await db.query(
      'INSERT INTO competitors (name, url, linkedin_id, instagram_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [name.trim(), url.trim(), linkedin_id?.trim() || null, instagram_id?.trim() || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, url, linkedin_id, instagram_id } = req.body;
    if (!name?.trim() || !url?.trim()) {
      return res.status(400).json({ error: 'name and url are required' });
    }
    const { rows } = await db.query(
      'UPDATE competitors SET name=$1, url=$2, linkedin_id=$3, instagram_id=$4 WHERE id=$5 RETURNING *',
      [name.trim(), url.trim(), linkedin_id?.trim() || null, instagram_id?.trim() || null, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await db.query('DELETE FROM competitors WHERE id=$1 RETURNING id', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: rows[0].id });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
