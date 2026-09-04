-- TelePost — Remove payments, subscriptions and plans tables.
-- TelePost is now completely free. The old monetization tables are no lighter
-- than unused rows; drop them to keep the schema in sync with the code (which
-- no longer references plans/subscriptions/payments anywhere).
--
-- Drop in FK-safe order: payments references plans, subscriptions references
-- plans (and users). Dropping a table whose rows are merely legacy is safe —
-- nothing in the running worker queries them anymore.
DROP TABLE payments;
DROP TABLE subscriptions;
DROP TABLE plans;