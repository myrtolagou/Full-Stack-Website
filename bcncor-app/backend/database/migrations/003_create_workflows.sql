-- =============================================================
-- migrations/003_create_workflows.sql
--
-- Creates the `workflows` table.
--
-- PURPOSE:
--   Stores automation workflows linked to campaigns.
--   Each workflow has a trigger type and a JSONB steps array
--   describing the sequence of automated actions to execute.
--
-- DEPENDS ON: 001_create_users.sql, 002_create_campaigns.sql
--
-- HOW TO RUN:
--   psql $DATABASE_URL -f database/migrations/003_create_workflows.sql
-- =============================================================

/*
CREATE TABLE workflows (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255)  NOT NULL,
  campaign_id   UUID          REFERENCES campaigns(id) ON DELETE CASCADE,
  trigger       VARCHAR(100),                              -- e.g. 'form_submit' | 'schedule' | 'manual'
  steps         JSONB         NOT NULL DEFAULT '[]',       -- ordered array of step objects
  is_active     BOOLEAN       NOT NULL DEFAULT FALSE,
  created_by    UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
*/
