const { Pool, types } = require('pg');
const { env } = require('./env');

// Return PostgreSQL DATE columns as plain "YYYY-MM-DD" strings instead of
// JS Date objects, which avoids UTC offset shifts when serialising to JSON.
types.setTypeParser(1082, val => val);

// Unix socket connections (Cloud Run → Cloud SQL) don't support SSL
const isUnixSocket = (env.DATABASE_URL || '').includes('/cloudsql/');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ...(isUnixSocket ? {} : { ssl: { rejectUnauthorized: false } }),
});

const db = {
  query: (text, params) => pool.query(text, params),
};

module.exports = db;