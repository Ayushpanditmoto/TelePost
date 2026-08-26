-- TelePost — Initial Database Migration
-- Generated for Cloudflare D1 (SQLite)

PRAGMA foreign_keys = ON;

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  telegram_id INTEGER NOT NULL UNIQUE,
  telegram_username TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_idx ON users(telegram_id);

-- ─── Plans ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  max_channels INTEGER NOT NULL,
  max_scheduled_posts INTEGER NOT NULL,
  max_media_mb INTEGER NOT NULL DEFAULT 0,
  allow_recurring INTEGER NOT NULL DEFAULT 0,
  features TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Subscriptions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','expired','cancelled','pending')),
  started_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);

-- ─── Telegram Bots ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_bots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_bot_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  encrypted_token TEXT NOT NULL,
  token_key_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS bots_user_id_idx ON telegram_bots(user_id);

-- ─── Telegram Channels ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_channels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bot_id TEXT NOT NULL REFERENCES telegram_bots(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL,
  username TEXT,
  title TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS channels_user_id_idx ON telegram_channels(user_id);
CREATE INDEX IF NOT EXISTS channels_bot_id_idx ON telegram_channels(bot_id);

-- ─── Posts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
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

-- ─── Post Media ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_media (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS post_media_post_id_idx ON post_media(post_id);

-- ─── Payments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed','expired')),
  transaction_reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);

-- ─── Post Analytics ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_analytics (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  forwards INTEGER NOT NULL DEFAULT 0,
  reactions INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  measured_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS analytics_post_id_idx ON post_analytics(post_id);

-- ─── Seed: Default Plans ─────────────────────────────────────────────────────
INSERT OR IGNORE INTO plans (id, name, slug, price, currency, max_channels, max_scheduled_posts, max_media_mb, allow_recurring, features) VALUES
  ('plan_free',     'Free',     'free',     0,   'USD', 1,  10,  10,  0, '["1 channel","10 scheduled posts","Images & videos (10 MB)","Basic scheduling"]'),
  ('plan_pro',      'Pro',      'pro',      19,  'USD', 5,  100, 100, 1, '["5 channels","100 scheduled posts","Images & videos","Recurring posts","Timezone support"]'),
  ('plan_business', 'Business', 'business', 49,  'USD', 20, 0,   500, 1, '["20 channels","Unlimited posts","Images & videos","Recurring posts","Priority support","Post analytics"]');
