-- =============================================================
-- schema.sql
--
-- Master reference file for the BcnCor PostgreSQL database.
-- Contains all four table definitions in one place.
--
-- PURPOSE:
--   This file is the single source of truth for the full DB schema.
--   Use it to understand the overall structure at a glance.
--   For applying changes to an existing database, use the individual
--   migration files in database/migrations/ instead.
--
-- HOW TO RUN (fresh setup only):
--   psql $DATABASE_URL -f database/schema.sql
--
-- TABLES:
--   1. users       — app users with roles and avatars
--   2. campaigns   — marketing campaigns owned by users
--   3. workflows   — automation workflows linked to campaigns
--   4. tasks       — actionable tasks linked to campaigns and users
-- =============================================================


-- -------------------------------------------------------------
-- 1. USERS
-- -------------------------------------------------------------
/*
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,
  role          VARCHAR(50)   NOT NULL DEFAULT 'member',  -- admin | member
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
*/


-- -------------------------------------------------------------
-- 2. CAMPAIGNS
-- -------------------------------------------------------------
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


-- -------------------------------------------------------------
-- 3. WORKFLOWS
-- -------------------------------------------------------------
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


-- -------------------------------------------------------------
-- 4. TASKS
-- -------------------------------------------------------------
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
