-- =============================================================
-- seeds/dev_campaigns.sql
--
-- Sample marketing campaigns for local development.
--
-- PURPOSE:
--   Populates the `campaigns` table with realistic entries so the
--   campaigns UI can be built and tested without manual data entry.
--
-- NOTE:
--   owner_id values must match UUIDs seeded in dev_users.sql.
--   Replace the placeholder UUIDs below with real ones after seeding users,
--   or use a subquery as shown in the commented example.
--
-- DEPENDS ON: 001_create_users.sql, 002_create_campaigns.sql, dev_users.sql
--
-- HOW TO RUN:
--   psql $DATABASE_URL -f database/seeds/dev_campaigns.sql
-- =============================================================

/*
INSERT INTO campaigns (title, description, status, owner_id, start_date, end_date) VALUES
  (
    'Q1 Email Outreach',
    'Cold email campaign targeting SME decision-makers in the EMEA region.',
    'active',
    (SELECT id FROM users WHERE email = 'alex@bcncor.com'),
    '2026-01-06',
    '2026-03-28'
  ),
  (
    'Spring Social Push',
    'Coordinated LinkedIn and Instagram content series for brand awareness.',
    'draft',
    (SELECT id FROM users WHERE email = 'maria@bcncor.com'),
    '2026-03-01',
    '2026-04-30'
  ),
  (
    'Partner Referral Launch',
    'Campaign to onboard and activate new referral partners.',
    'draft',
    (SELECT id FROM users WHERE email = 'alex@bcncor.com'),
    '2026-04-01',
    '2026-06-30'
  ),
  (
    'Product Demo Series',
    'Weekly live demos targeting warm leads from Q1 outreach.',
    'completed',
    (SELECT id FROM users WHERE email = 'james@bcncor.com'),
    '2025-10-01',
    '2025-12-20'
  );
*/
