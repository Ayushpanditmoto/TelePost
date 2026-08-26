-- TelePost — Recurring post series (daily / custom weekdays).
-- Every upcoming occurrence is stored as its own posts row sharing series_id;
-- timestamps are generated client-side so each is correct in the user's timezone.
ALTER TABLE posts ADD COLUMN series_id TEXT;
CREATE INDEX posts_series_id_idx ON posts(series_id);