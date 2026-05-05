-- ============================================================
-- Rescue Platform Schema Migration
-- Thêm mới: service_requests, categories, pricing, matching, KYC, ratings, chat
-- Giữ nguyên: tasks, task_assignments, checkins (backward compat)
-- ============================================================

-- ============================================================
-- Extend existing enums (ADD VALUE is safe, no rewrite needed)
-- ============================================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'request_created';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'request_assigned';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'request_status_changed';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'request_completed';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'request_cancelled';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'staff_kyc_submitted';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'staff_kyc_approved';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'staff_kyc_rejected';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'rating_submitted';

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'request_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'request_available';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'request_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'request_completed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'request_cancelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'kyc_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'kyc_rejected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_chat_message';

-- ============================================================
-- New enums
-- ============================================================
CREATE TYPE request_status AS ENUM (
  'unavailable',
  'available',
  'pending_assignment',
  'assigned',
  'in_progress',
  'completed',
  'completed_late',
  'cancelled'
);

CREATE TYPE request_priority AS ENUM ('normal', 'urgent', 'sos');

CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE staff_kyc_doc_type AS ENUM (
  'national_id_front',
  'national_id_back',
  'driver_license',
  'certification',
  'other'
);

CREATE TYPE chat_channel AS ENUM ('customer_operator', 'customer_staff');

-- ============================================================
-- service_categories
-- ============================================================
CREATE TABLE service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url    TEXT,
  keywords    TEXT[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_categories_slug ON service_categories(slug);
CREATE INDEX idx_service_categories_active ON service_categories(is_active);
CREATE INDEX idx_service_categories_keywords ON service_categories USING GIN(keywords);

CREATE TRIGGER service_categories_updated_at BEFORE UPDATE ON service_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- staff_skills
-- ============================================================
CREATE TABLE staff_skills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id       UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  proficiency_level INTEGER NOT NULL DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id, category_id)
);

CREATE INDEX idx_staff_skills_tenant_category ON staff_skills(tenant_id, category_id);
CREATE INDEX idx_staff_skills_user_tenant ON staff_skills(user_id, tenant_id);

-- ============================================================
-- service_pricings
-- ============================================================
CREATE TABLE service_pricings (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id                UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  service_name               TEXT NOT NULL,
  price_min                  NUMERIC(12,2),
  price_max                  NUMERIC(12,2),
  price_fixed                NUMERIC(12,2),
  currency                   TEXT NOT NULL DEFAULT 'VND',
  estimated_duration_minutes INTEGER,
  is_active                  BOOLEAN NOT NULL DEFAULT true,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_pricings_tenant ON service_pricings(tenant_id);
CREATE INDEX idx_service_pricings_tenant_category ON service_pricings(tenant_id, category_id);

CREATE TRIGGER service_pricings_updated_at BEFORE UPDATE ON service_pricings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- service_requests
-- ============================================================
CREATE TABLE service_requests (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                UUID NOT NULL REFERENCES users(id),
  category_id                UUID REFERENCES service_categories(id),
  ai_suggested_categories    UUID[],
  description                TEXT NOT NULL,
  photo_urls                 TEXT[] NOT NULL DEFAULT '{}',
  location_name              TEXT,
  location_address           TEXT,
  location_lat               DOUBLE PRECISION NOT NULL,
  location_lng               DOUBLE PRECISION NOT NULL,
  scheduled_at               TIMESTAMPTZ,
  is_emergency               BOOLEAN NOT NULL DEFAULT false,
  status                     request_status NOT NULL DEFAULT 'unavailable',
  priority                   request_priority NOT NULL DEFAULT 'normal',
  tenant_id                  UUID REFERENCES tenants(id),
  pricing_id                 UUID REFERENCES service_pricings(id),
  agreed_price               NUMERIC(12,2),
  estimated_duration_minutes INTEGER,
  assigned_staff_id          UUID REFERENCES users(id),
  assigned_by                UUID REFERENCES users(id),
  assigned_at                TIMESTAMPTZ,
  started_at                 TIMESTAMPTZ,
  completed_at               TIMESTAMPTZ,
  deadline                   TIMESTAMPTZ,
  cancel_reason              TEXT,
  cancelled_by               UUID REFERENCES users(id),
  cancelled_at               TIMESTAMPTZ,
  requote_reason             TEXT,
  requote_price              NUMERIC(12,2),
  requote_at                 TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_requests_customer ON service_requests(customer_id);
CREATE INDEX idx_service_requests_tenant ON service_requests(tenant_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_staff ON service_requests(assigned_staff_id);
CREATE INDEX idx_service_requests_created ON service_requests(created_at DESC);
CREATE INDEX idx_service_requests_available_category ON service_requests(status, category_id)
  WHERE status = 'available';
CREATE INDEX idx_service_requests_emergency ON service_requests(created_at)
  WHERE is_emergency = true AND status NOT IN ('completed', 'completed_late', 'cancelled');

CREATE TRIGGER service_requests_updated_at BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- staff_status (online/offline toggle)
-- ============================================================
CREATE TABLE staff_status (
  user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  is_online    BOOLEAN NOT NULL DEFAULT false,
  last_ping_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_status_tenant_online ON staff_status(tenant_id, is_online);

-- ============================================================
-- staff_locations (GPS history)
-- ============================================================
CREATE TABLE staff_locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lat        DOUBLE PRECISION NOT NULL,
  lng        DOUBLE PRECISION NOT NULL,
  accuracy_m DOUBLE PRECISION,
  heading    DOUBLE PRECISION,
  speed_mps  DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_locations_user_created ON staff_locations(user_id, created_at DESC);
CREATE INDEX idx_staff_locations_tenant ON staff_locations(tenant_id);

-- ============================================================
-- request_chats (per-request messaging)
-- ============================================================
CREATE TABLE request_chats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel    chat_channel NOT NULL,
  content    TEXT,
  media_urls TEXT[] DEFAULT '{}',
  is_system  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_request_chats_request_channel ON request_chats(request_id, channel, created_at ASC);
CREATE INDEX idx_request_chats_user ON request_chats(user_id);

-- ============================================================
-- ratings
-- ============================================================
CREATE TABLE ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL UNIQUE REFERENCES service_requests(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id),
  staff_id    UUID NOT NULL REFERENCES users(id),
  score       SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ratings_staff ON ratings(staff_id);
CREATE INDEX idx_ratings_request ON ratings(request_id);

-- Auto-update rating_avg on users when rating inserted
CREATE OR REPLACE FUNCTION update_staff_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET
    rating_avg   = (SELECT AVG(score)::NUMERIC(3,2) FROM ratings WHERE staff_id = NEW.staff_id),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE staff_id = NEW.staff_id)::INTEGER
  WHERE id = NEW.staff_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ratings_update_staff_avg AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_staff_rating();

-- ============================================================
-- staff_kyc
-- ============================================================
CREATE TABLE staff_kyc (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doc_type      staff_kyc_doc_type NOT NULL,
  doc_url       TEXT NOT NULL,
  status        kyc_status NOT NULL DEFAULT 'pending',
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  reject_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id, doc_type)
);

CREATE INDEX idx_staff_kyc_user_tenant ON staff_kyc(user_id, tenant_id);
CREATE INDEX idx_staff_kyc_status ON staff_kyc(status);

CREATE TRIGGER staff_kyc_updated_at BEFORE UPDATE ON staff_kyc
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Alter existing tables (additive only)
-- ============================================================

-- users: add rating cache + kyc status columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS kyc_status kyc_status,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- notifications: make tenant_id nullable (customers have no tenant)
ALTER TABLE notifications ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL;

-- audit_logs: make tenant_id nullable + add request_id
ALTER TABLE audit_logs ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL;

-- ============================================================
-- Storage buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('request-photos', 'request-photos', true),
  ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seed initial service categories
-- ============================================================
INSERT INTO service_categories (name, slug, keywords, sort_order) VALUES
  ('Sửa Laptop', 'sua-laptop',
   ARRAY['laptop','máy tính','màn hình','bàn phím','pin','sạc','không bật','treo máy','hỏng laptop','máy chậm','không lên nguồn','bàn phím hỏng','màn hình đen'],
   1),
  ('Sửa Xe Máy', 'sua-xe-may',
   ARRAY['xe máy','xe','hỏng xe','nổ lốp','hết xăng','không nổ máy','đứt dây','thủng lốp','chết máy','hết bình','xe không nổ','vá xe'],
   2),
  ('Sửa Ô Tô', 'sua-o-to',
   ARRAY['ô tô','xe hơi','car','hỏng xe ô tô','pin xe ô tô','nổ lốp xe hơi','hết xăng ô tô','xe bị chết','xe không khởi động','ắc quy ô tô'],
   3),
  ('Điện - Điện Lạnh', 'dien-dien-lanh',
   ARRAY['điện','điều hòa','tủ lạnh','máy giặt','quạt','mất điện','chập điện','điều hoà không lạnh','tủ lạnh không mát','hỏng điện','cúp điện','máy lạnh'],
   4),
  ('IT Support', 'it-support',
   ARRAY['mạng','wifi','máy tính','cài đặt','virus','phần mềm','server','printer','mạng không vào','wifi yếu','máy bị virus','cài win','không kết nối mạng','máy in hỏng'],
   5),
  ('Khóa - Cửa', 'khoa-cua',
   ARRAY['khóa','cửa','chìa khóa','mất chìa','hỏng khóa','két sắt','bẻ khóa','khóa cửa hỏng','không mở được cửa','mất chìa khoá','kẹt cửa'],
   6)
ON CONFLICT (slug) DO NOTHING;
