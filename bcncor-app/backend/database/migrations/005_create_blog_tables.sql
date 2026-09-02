-- Migration 005: blog_inbox_items and blog_carousels

CREATE TABLE IF NOT EXISTS blog_inbox_items (
  id           TEXT          PRIMARY KEY,
  source       TEXT          NOT NULL DEFAULT 'blog',
  url          TEXT          NOT NULL,
  title        TEXT,
  status       TEXT          NOT NULL DEFAULT 'pending',
  date         TEXT,
  excerpt      TEXT,
  full_text    TEXT,
  tags         JSONB         NOT NULL DEFAULT '[]',
  slides       JSONB,
  done_date    TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_carousels (
  id             TEXT          PRIMARY KEY,
  inbox_item_id  TEXT          REFERENCES blog_inbox_items(id) ON DELETE CASCADE,
  source         TEXT          NOT NULL DEFAULT 'blog',
  title          TEXT,
  url            TEXT,
  slides         JSONB         NOT NULL DEFAULT '[]',
  date           TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
