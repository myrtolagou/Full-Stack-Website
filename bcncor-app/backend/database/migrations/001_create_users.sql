-- =============================================================
-- migrations/001_create_users.sql
--
-- Creates the `users` table.
--
-- PURPOSE:
--   Stores all authenticated users of the BcnCor platform.
--   Each user has a role (admin or member) that controls access.
--
-- DEPENDS ON: nothing — run this first
--
-- HOW TO RUN:
--   psql $DATABASE_URL -f database/migrations/001_create_users.sql
-- =============================================================

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
