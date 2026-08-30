-- Chat profile photos: R2 key of the channel/supergroup avatar, downloaded
-- from the Bot API (getChat -> photo.small_file_id -> getFile -> download).
ALTER TABLE telegram_channels ADD COLUMN photo_key TEXT;
