-- TelePost — Move to the platform's own (@Panditfxbot) for publishing.
-- Users no longer create their own bot; they add @Panditfxbot as an admin.

PRAGMA foreign_keys = OFF;

-- Rebuild telegram_channels without the per-user bot FK.
ALTER TABLE telegram_channels RENAME TO telegram_channels_old;

CREATE TABLE telegram_channels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_bot_id INTEGER NOT NULL DEFAULT 8985221169,
  telegram_chat_id TEXT NOT NULL,
  username TEXT,
  title TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS channels_user_id_idx ON telegram_channels(user_id);

-- Copy existing channel rows (bot_id was a uuid → map to platform bot id).
INSERT INTO telegram_channels (id, user_id, telegram_bot_id, telegram_chat_id, username, title, verified, created_at, updated_at)
SELECT id, user_id, 8985221169, telegram_chat_id, username, title, verified, created_at, updated_at
FROM telegram_channels_old;

DROP TABLE telegram_channels_old;

-- Existing per-user bots are no longer used by publishing.
-- Kept for reference; may be cleaned up separately.

PRAGMA foreign_keys = ON;