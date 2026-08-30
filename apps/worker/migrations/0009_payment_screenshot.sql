-- TelePost — Manual QR payment review fields.
-- Users paying via the TrustWallet QR upload a screenshot; the admin
-- approves/rejects from the admin panel. Adds review metadata to payments.
ALTER TABLE payments ADD COLUMN screenshot_key TEXT;
ALTER TABLE payments ADD COLUMN note TEXT;
ALTER TABLE payments ADD COLUMN rejection_reason TEXT;
ALTER TABLE payments ADD COLUMN reviewed_at TEXT;
ALTER TABLE payments ADD COLUMN reviewed_by TEXT;