-- =============================================================
-- seeds/dev_users.sql
--
-- Sample users for local development.
--
-- PURPOSE:
--   Populates the `users` table with realistic team members so the
--   frontend and API can be tested without creating accounts manually.
--
-- NOTE:
--   Password hashes below correspond to the plain-text value 'password123'
--   (bcrypt, 12 rounds). DO NOT use these in production.
--
-- DEPENDS ON: 001_create_users.sql
--
-- HOW TO RUN:
--   psql $DATABASE_URL -f database/seeds/dev_users.sql
-- =============================================================

/*
INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES
  (
    'Alex Johnson',
    'alex@bcncor.com',
    '$2a$12$KIXJkHpW0bF1k7FzN.yZqOlE1cjHtF/VrxQKLBdFjMt5T7g8K3nBe',
    'admin',
    NULL
  ),
  (
    'Maria Santos',
    'maria@bcncor.com',
    '$2a$12$KIXJkHpW0bF1k7FzN.yZqOlE1cjHtF/VrxQKLBdFjMt5T7g8K3nBe',
    'member',
    NULL
  ),
  (
    'James Lee',
    'james@bcncor.com',
    '$2a$12$KIXJkHpW0bF1k7FzN.yZqOlE1cjHtF/VrxQKLBdFjMt5T7g8K3nBe',
    'member',
    NULL
  ),
  (
    'Sofia Andrade',
    'sofia@bcncor.com',
    '$2a$12$KIXJkHpW0bF1k7FzN.yZqOlE1cjHtF/VrxQKLBdFjMt5T7g8K3nBe',
    'member',
    NULL
  )
ON CONFLICT (email) DO NOTHING;
*/
