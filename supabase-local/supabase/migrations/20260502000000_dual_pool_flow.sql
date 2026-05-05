-- Add negotiating status to request_status enum
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'negotiating';

-- Add staff pool flag to service_requests
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS is_in_staff_pool BOOLEAN NOT NULL DEFAULT false;

-- Table to store which tenants were matched to each request
-- Allows customer to see list of tenants + pricing, and lets operators see only matched requests in pool
CREATE TABLE IF NOT EXISTS request_tenant_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pricing_id   UUID REFERENCES service_pricings(id),
  matched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_request_tenant_matches_request ON request_tenant_matches(request_id);
CREATE INDEX IF NOT EXISTS idx_request_tenant_matches_tenant  ON request_tenant_matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_staff_pool
  ON service_requests(tenant_id, status, is_in_staff_pool)
  WHERE is_in_staff_pool = true;
