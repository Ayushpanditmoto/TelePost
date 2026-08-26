-- TelePost — Repair FKs after the 0004 channel-table rebuild.
-- SQLite's ALTER TABLE RENAME rewrote posts.channel_id's REFERENCES clause to
-- point at "telegram_channels_old", which was then dropped — so every INSERT
-- INTO posts failed with "no such table: main.telegram_channels_old".
-- Rebuild posts + its children with correct references.
-- (Safe: these tables held no production rows at time of writing.)

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS post_analytics;
DROP TABLE IF EXISTS post_media;
DROP TABLE IF EXISTS posts;

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES telegram_channels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','publishing','published','failed','cancelled')),
  scheduled_at TEXT,
  published_at TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  telegram_message_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_channel_id_idx ON posts(channel_id);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS posts_scheduled_at_idx ON posts(scheduled_at);

CREATE TABLE post_media (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS post_media_post_id_idx ON post_media(post_id);

CREATE TABLE post_analytics (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  forwards INTEGER NOT NULL DEFAULT 0,
  reactions INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  measured_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS analytics_post_id_idx ON post_analytics(post_id);

PRAGMA foreign_keys = ON;