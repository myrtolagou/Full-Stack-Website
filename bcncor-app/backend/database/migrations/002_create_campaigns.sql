-- =============================================================
-- migrations/002_create_campaigns.sql
--
-- Creates the `campaigns` table.
--
-- PURPOSE:
--   Stores marketing campaigns. Each campaign is owned by a user
--   and can have a status of draft, active, or completed.
--
-- DEPENDS ON: 001_create_users.sql (users table must exist)
--
-- HOW TO RUN:
--   psql $DATABASE_URL -f database/migrations/002_create_campaigns.sql
-- =============================================================

/*
CREATE TABLE campaigns (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(255)  NOT NULL,
  description   TEXT,
  status        VARCHAR(50)   NOT NULL DEFAULT 'draft',   -- draft | active | completed
  owner_id      UUID          REFERENCES users(id) ON DELETE SET NULL,
  start_date    DATE,
  end_date      DATE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
*/
