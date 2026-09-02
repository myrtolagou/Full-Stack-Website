-- =============================================================
-- migrations/004_create_tasks.sql
--
-- Creates the `tasks` table.
--
-- PURPOSE:
--   Stores actionable tasks associated with campaigns.
--   Tasks can be assigned to users and tracked through a
--   todo → in_progress → done lifecycle.
--
-- DEPENDS ON: 001_create_users.sql, 002_create_campaigns.sql
--
-- HOW TO RUN:
--   psql $DATABASE_URL -f database/migrations/004_create_tasks.sql
-- =============================================================

/*
CREATE TABLE tasks (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(255)  NOT NULL,
  description   TEXT,
  status        VARCHAR(50)   NOT NULL DEFAULT 'todo',     -- todo | in_progress | done
  assigned_to   UUID          REFERENCES users(id) ON DELETE SET NULL,
  campaign_id   UUID          REFERENCES campaigns(id) ON DELETE CASCADE,
  due_date      DATE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
*/
