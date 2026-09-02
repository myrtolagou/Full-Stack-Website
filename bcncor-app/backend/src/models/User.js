const db = require('../config/db');

async function findAll() {
  const result = await db.query(`
    SELECT id, name, email, role, created_at FROM users
    ORDER BY
      CASE
        WHEN role = 'Admin'                                  THEN 0
        WHEN email = 'patricio.hunt@bcncor.com'         THEN 1
        WHEN email = 'ines.martinez@bcncor.com'         THEN 2
        WHEN email = 'carlota.martinez@bcncor.com'      THEN 3
        ELSE 4
      END,
      created_at ASC
  `);
  return result.rows;
}

async function findById(id) {
  const result = await db.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function findByEmail(email) {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

async function create({ name, email, password_hash, role = 'member' }) {
  const result = await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
    [name, email, password_hash, role]
  );
  return result.rows[0];
}

async function update(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const result = await db.query(
    `UPDATE users SET ${set} WHERE id = $${keys.length + 1} RETURNING id, name, email, role, created_at`,
    [...values, id]
  );
  return result.rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = { findAll, findById, findByEmail, create, update, remove };