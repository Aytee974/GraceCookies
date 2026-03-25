-- Add confirmation_sent_at to track when pickup-ready email was sent to customer
-- NULL = not yet sent; timestamp = sent at that time
ALTER TABLE orders ADD COLUMN confirmation_sent_at timestamptz;
