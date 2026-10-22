-- =====================================================================
--  CATALOG_DB  -  script độc lập, copy & chạy ngay
--  Bước 1: chạy 00_create_databases.sql (một lần duy nhất)
--  Bước 2: mở kết nối tới database "catalog_db" rồi chạy toàn bộ file này
--          (psql: psql -U postgres -d catalog_db -f 02_catalog_db.sql)
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TABLE IF NOT EXISTS units (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code  varchar(20) NOT NULL UNIQUE,                    -- g, ml, tbsp...
  name  varchar(50) NOT NULL,
  type  text NOT NULL DEFAULT 'OTHER'
        CHECK (type IN ('WEIGHT', 'VOLUME', 'COUNT', 'OTHER'))
);

CREATE TABLE IF NOT EXISTS ingredients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar(150) NOT NULL UNIQUE,
  aliases       text[]       NOT NULL DEFAULT '{}',     -- tên gọi khác để gợi ý/autocomplete
  category      varchar(80),
  allergen_tags text[]       NOT NULL DEFAULT '{}',     -- vd: {peanut,egg,gluten}
  diet_blockers text[]       NOT NULL DEFAULT '{}',     -- vd: {VEGAN,VEGETARIAN}: chế độ ăn KHÔNG dùng được
  is_active     boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ingredients_name_trgm
  ON ingredients USING gin (name gin_trgm_ops);         -- GET /ingredients?q=
CREATE INDEX IF NOT EXISTS idx_ingredients_aliases
  ON ingredients USING gin (aliases);

DROP TRIGGER IF EXISTS trg_ingredients_updated_at ON ingredients;
CREATE TRIGGER trg_ingredients_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS tags (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  varchar(80) NOT NULL,
  type  text NOT NULL CHECK (type IN ('CUISINE', 'DISH_TYPE', 'DIET')),
  UNIQUE (name, type)
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type text        NOT NULL,
  aggregate_id   text        NOT NULL,
  event_type     text        NOT NULL,                  -- ingredient.updated ...
  payload        jsonb       NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  published_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished
  ON outbox_events (created_at) WHERE published_at IS NULL;

-- Seed dữ liệu mẫu
INSERT INTO units (code, name, type) VALUES
  ('g', 'Gram', 'WEIGHT'), ('kg', 'Kilogram', 'WEIGHT'),
  ('ml', 'Mililit', 'VOLUME'), ('l', 'Lít', 'VOLUME'),
  ('tsp', 'Muỗng cà phê', 'VOLUME'), ('tbsp', 'Muỗng canh', 'VOLUME'),
  ('cup', 'Chén', 'VOLUME'),
  ('piece', 'Cái / quả / miếng', 'COUNT'), ('clove', 'Tép', 'COUNT'),
  ('pinch', 'Nhúm', 'OTHER')
ON CONFLICT (code) DO NOTHING;

INSERT INTO tags (name, type) VALUES
  ('Việt Nam', 'CUISINE'), ('Ý', 'CUISINE'), ('Nhật Bản', 'CUISINE'),
  ('Hàn Quốc', 'CUISINE'), ('Thái Lan', 'CUISINE'),
  ('Món chính', 'DISH_TYPE'), ('Món canh', 'DISH_TYPE'), ('Món khai vị', 'DISH_TYPE'),
  ('Tráng miệng', 'DISH_TYPE'), ('Đồ uống', 'DISH_TYPE'), ('Ăn sáng', 'DISH_TYPE'),
  ('Ăn chay', 'DIET'), ('Thuần chay', 'DIET'), ('Keto', 'DIET'), ('Halal', 'DIET')
ON CONFLICT (name, type) DO NOTHING;

INSERT INTO ingredients (name, aliases, category, allergen_tags, diet_blockers) VALUES
  ('Trứng gà',      ARRAY['trứng'],          'Trứng & sữa', ARRAY['egg'],     ARRAY['VEGAN']),
  ('Sữa tươi',      ARRAY['sữa'],            'Trứng & sữa', ARRAY['milk'],    ARRAY['VEGAN']),
  ('Thịt gà',       ARRAY['gà'],             'Thịt',        ARRAY[]::text[],  ARRAY['VEGAN','VEGETARIAN']),
  ('Thịt heo',      ARRAY['heo','lợn'],      'Thịt',        ARRAY[]::text[],  ARRAY['VEGAN','VEGETARIAN','HALAL']),
  ('Thịt bò',       ARRAY['bò'],             'Thịt',        ARRAY[]::text[],  ARRAY['VEGAN','VEGETARIAN']),
  ('Tôm',           ARRAY['tôm sú'],         'Hải sản',     ARRAY['shellfish'], ARRAY['VEGAN','VEGETARIAN']),
  ('Đậu hũ',        ARRAY['đậu phụ'],        'Đậu',         ARRAY['soy'],     ARRAY[]::text[]),
  ('Cà chua',       ARRAY[]::text[],         'Rau củ',      ARRAY[]::text[],  ARRAY[]::text[]),
  ('Hành tây',      ARRAY[]::text[],         'Rau củ',      ARRAY[]::text[],  ARRAY[]::text[]),
  ('Tỏi',           ARRAY[]::text[],         'Gia vị',      ARRAY[]::text[],  ARRAY[]::text[]),
  ('Gạo',           ARRAY['cơm'],            'Tinh bột',    ARRAY[]::text[],  ARRAY['KETO']),
  ('Bún',           ARRAY[]::text[],         'Tinh bột',    ARRAY[]::text[],  ARRAY['KETO']),
  ('Mì ý',          ARRAY['spaghetti'],      'Tinh bột',    ARRAY['gluten'],  ARRAY['KETO']),
  ('Đậu phộng',     ARRAY['lạc'],            'Hạt',         ARRAY['peanut'],  ARRAY[]::text[]),
  ('Nước mắm',      ARRAY[]::text[],         'Gia vị',      ARRAY['fish'],    ARRAY['VEGAN','VEGETARIAN']),
  ('Dầu ăn',        ARRAY[]::text[],         'Gia vị',      ARRAY[]::text[],  ARRAY[]::text[])
ON CONFLICT (name) DO NOTHING;

COMMIT;
