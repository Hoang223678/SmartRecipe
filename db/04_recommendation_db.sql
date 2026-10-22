-- =====================================================================
--  RECOMMENDATION_DB  -  script độc lập, copy & chạy ngay
--  Bước 1: chạy 00_create_databases.sql (một lần duy nhất)
--  Bước 2: mở kết nối tới database "recommendation_db" rồi chạy toàn bộ file này
--          (psql: psql -U postgres -d recommendation_db -f 04_recommendation_db.sql)
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- Bản sao đọc (read model) của công thức, cập nhật qua event recipe.*
CREATE TABLE IF NOT EXISTS recipe_read_models (
  recipe_id         uuid PRIMARY KEY,
  title             varchar(200) NOT NULL,
  thumbnail_url     text,
  author_id         uuid         NOT NULL,
  author_name       varchar(100) NOT NULL,
  cook_time_minutes integer      NOT NULL DEFAULT 0,
  difficulty        text         NOT NULL DEFAULT 'EASY',
  avg_rating        numeric(3,2) NOT NULL DEFAULT 0,
  rating_count      integer      NOT NULL DEFAULT 0,
  ingredient_ids    uuid[]       NOT NULL DEFAULT '{}',   -- nguyên liệu bắt buộc (không tính optional)
  ingredient_count  integer      NOT NULL DEFAULT 0,
  tag_ids           uuid[]       NOT NULL DEFAULT '{}',
  allergen_tags     text[]       NOT NULL DEFAULT '{}',   -- gộp từ nguyên liệu
  diet_blockers     text[]       NOT NULL DEFAULT '{}',   -- chế độ ăn KHÔNG phù hợp
  is_active         boolean      NOT NULL DEFAULT true,   -- false khi HIDDEN/xóa
  updated_at        timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rrm_ingredients ON recipe_read_models USING gin (ingredient_ids);
CREATE INDEX IF NOT EXISTS idx_rrm_allergens   ON recipe_read_models USING gin (allergen_tags);
CREATE INDEX IF NOT EXISTS idx_rrm_active_time ON recipe_read_models (cook_time_minutes) WHERE is_active;

DROP TRIGGER IF EXISTS trg_rrm_updated_at ON recipe_read_models;
CREATE TRIGGER trg_rrm_updated_at BEFORE UPDATE ON recipe_read_models
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS diet_profiles (
  user_id                uuid PRIMARY KEY,                 -- ref logic: auth_db.users.id
  diets                  text[] NOT NULL DEFAULT '{}'
                         CHECK (diets <@ ARRAY['VEGETARIAN','VEGAN','KETO','HALAL']),
  allergens              text[] NOT NULL DEFAULT '{}',
  disliked_ingredient_ids uuid[] NOT NULL DEFAULT '{}',
  updated_at             timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_diet_updated_at ON diet_profiles;
CREATE TRIGGER trg_diet_updated_at BEFORE UPDATE ON diet_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS recommendation_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL,
  ingredient_ids  uuid[]      NOT NULL,
  filters         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  result_count    integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reco_history_user ON recommendation_history (user_id, created_at DESC);

-- Cấu hình thuật toán (Admin chỉnh qua PUT /admin/settings/recommendation), chỉ 1 dòng
CREATE TABLE IF NOT EXISTS recommendation_settings (
  id                  smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  weight_match_ratio  numeric(4,3) NOT NULL DEFAULT 0.600,
  weight_rating       numeric(4,3) NOT NULL DEFAULT 0.250,
  weight_diet_fit     numeric(4,3) NOT NULL DEFAULT 0.150,
  min_match_ratio     numeric(4,3) NOT NULL DEFAULT 0.500
                      CHECK (min_match_ratio BETWEEN 0 AND 1),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);
INSERT INTO recommendation_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS processed_events (
  event_id      uuid PRIMARY KEY,
  processed_at  timestamptz NOT NULL DEFAULT now()
);

-- Hàm gợi ý theo nguyên liệu: tỷ lệ khớp = matched / total
-- Lọc dị ứng / chế độ ăn / nguyên liệu không thích đặt ở tham số tùy chọn.
CREATE OR REPLACE FUNCTION recommend_by_ingredients(
  p_ingredient_ids   uuid[],
  p_min_match_ratio  numeric DEFAULT NULL,       -- NULL = dùng cấu hình trong recommendation_settings
  p_max_cook_time    integer DEFAULT NULL,
  p_allergens        text[]  DEFAULT '{}',
  p_diets            text[]  DEFAULT '{}',
  p_disliked_ids     uuid[]  DEFAULT '{}',
  p_limit            integer DEFAULT 20
)
RETURNS TABLE (
  recipe_id     uuid,
  matched_count integer,
  total_count   integer,
  match_ratio   numeric,
  score         numeric
)
LANGUAGE sql STABLE AS $$
  WITH cfg AS (
    SELECT * FROM recommendation_settings WHERE id = 1
  ),
  cand AS (
    SELECT
      r.recipe_id,
      r.avg_rating,
      r.ingredient_count AS total,
      (SELECT count(*) FROM unnest(r.ingredient_ids) AS i
        WHERE i = ANY (p_ingredient_ids))::integer AS matched
    FROM recipe_read_models r
    WHERE r.is_active
      AND r.ingredient_count > 0
      AND r.ingredient_ids && p_ingredient_ids
      AND (p_max_cook_time IS NULL OR r.cook_time_minutes <= p_max_cook_time)
      AND NOT (r.allergen_tags && p_allergens)
      AND NOT (r.diet_blockers && p_diets)
      AND NOT (r.ingredient_ids && p_disliked_ids)
  )
  SELECT s.recipe_id, s.matched, s.total, s.ratio, s.score
  FROM (
    SELECT
      c.recipe_id,
      c.matched,
      c.total,
      round(c.matched::numeric / c.total, 4) AS ratio,
      round(cfg.weight_match_ratio * (c.matched::numeric / c.total)
          + cfg.weight_rating      * (c.avg_rating / 5.0), 4) AS score,
      cfg.min_match_ratio
    FROM cand c CROSS JOIN cfg
  ) s
  WHERE s.ratio >= COALESCE(p_min_match_ratio, s.min_match_ratio)
  ORDER BY s.score DESC, s.ratio DESC
  LIMIT p_limit;
$$;

COMMIT;
