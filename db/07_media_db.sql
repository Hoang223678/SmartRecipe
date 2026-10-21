-- =====================================================================
--  MEDIA_DB  -  script độc lập, copy & chạy ngay
--  Bước 1: chạy 00_create_databases.sql (một lần duy nhất)
--  Bước 2: mở kết nối tới database "media_db" rồi chạy toàn bộ file này
--          (psql: psql -U postgres -d media_db -f 07_media_db.sql)
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS media_assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid         NOT NULL,                   -- ref logic: auth_db.users.id
  storage_key   text         NOT NULL UNIQUE,
  url           text         NOT NULL,
  content_type  varchar(100) NOT NULL,
  size_bytes    bigint       NOT NULL CHECK (size_bytes > 0),
  width         integer,
  height        integer,
  created_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_owner ON media_assets (owner_id, created_at DESC);

COMMIT;
