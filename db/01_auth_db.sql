-- =====================================================================
--  AUTH_DB  -  script độc lập, copy & chạy ngay
--  Bước 1: chạy 00_create_databases.sql (một lần duy nhất)
--  Bước 2: mở kết nối tới database "auth_db" rồi chạy toàn bộ file này
--          (psql: psql -U postgres -d auth_db -f 01_auth_db.sql)
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- Guest không lưu trong DB (chưa đăng nhập)
CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext       NOT NULL UNIQUE,
  password_hash  text,                                  -- NULL nếu đăng nhập Google
  google_id      text UNIQUE,
  display_name   varchar(100) NOT NULL,
  avatar_url     text,
  role           text         NOT NULL DEFAULT 'USER'
                 CHECK (role IN ('USER', 'CHEF', 'MODERATOR', 'ADMIN')),
  status         text         NOT NULL DEFAULT 'ACTIVE'
                 CHECK (status IN ('ACTIVE', 'BANNED')),
  ban_reason     text,
  last_login_at  timestamptz,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash  text        NOT NULL UNIQUE,              -- chỉ lưu hash, không lưu token gốc
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  user_agent  text,
  ip_address  inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_exp  ON refresh_tokens (expires_at);

-- Đơn xin nâng cấp lên Chef (POST /chef/apply), Admin duyệt
CREATE TABLE IF NOT EXISTS chef_applications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  bio          text        NOT NULL,
  experience   text,
  status       text        NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by  uuid REFERENCES users (id),
  reviewed_at  timestamptz,
  reject_reason text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
-- Mỗi user chỉ có tối đa 1 đơn đang chờ
CREATE UNIQUE INDEX IF NOT EXISTS uq_chef_app_pending
  ON chef_applications (user_id) WHERE status = 'PENDING';

-- Nhật ký thao tác nhạy cảm của Admin/Moderator
CREATE TABLE IF NOT EXISTS audit_logs (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id     uuid        NOT NULL,
  action       text        NOT NULL,                    -- vd: USER_ROLE_CHANGED
  target_type  text        NOT NULL,
  target_id    text        NOT NULL,
  metadata     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);

-- Outbox: sự kiện user.role.changed, user.banned ...
CREATE TABLE IF NOT EXISTS outbox_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type text        NOT NULL,
  aggregate_id   text        NOT NULL,
  event_type     text        NOT NULL,
  payload        jsonb       NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  published_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished
  ON outbox_events (created_at) WHERE published_at IS NULL;

-- Tài khoản Admin đầu tiên: tạo bằng app/seed script với mật khẩu đã hash
-- (bcrypt/argon2), KHÔNG lưu mật khẩu thô trong file SQL. Ví dụ:
-- INSERT INTO users (email, password_hash, display_name, role)
-- VALUES ('admin@example.com', '<bcrypt_hash>', 'System Admin', 'ADMIN')
-- ON CONFLICT (email) DO NOTHING;

COMMIT;
