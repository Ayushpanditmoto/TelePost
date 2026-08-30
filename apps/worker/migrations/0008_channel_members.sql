-- Cached member counts for channels/supergroups (Bot API getChatMemberCount),
-- refreshed by GET /api/channels at most once per hour per channel.
ALTER TABLE telegram_channels ADD COLUMN member_count INTEGER;
ALTER TABLE telegram_channels ADD COLUMN member_count_updated_at TEXT;
