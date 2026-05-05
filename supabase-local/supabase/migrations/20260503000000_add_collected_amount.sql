-- Add collected amount tracking to service requests
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS collected_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ;
