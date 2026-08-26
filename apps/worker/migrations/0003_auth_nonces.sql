CREATE TABLE auth_nonces (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  user_id TEXT,
  consumed_at TEXT,
  expires_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX auth_nonces_expires_at_idx ON auth_nonces(expires_at);
