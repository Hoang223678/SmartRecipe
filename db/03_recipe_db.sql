-- =====================================================================
--  RECIPE_DB  -  script độc lập, copy & chạy ngay
--  Bước 1: chạy 00_create_databases.sql (một lần duy nhất)
--  Bước 2: mở kết nối tới database "recipe_db" rồi chạy toàn bộ file này
--          (psql: psql -U postgres -d recipe_db -f 03_recipe_db.sql)
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- Vòng đời: DRAFT -> PENDING -> APPROVED | REJECTED (-> sửa -> PENDING); HIDDEN do Moderator
CREATE TABLE IF NOT EXISTS recipes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id         uuid         NOT NULL,              -- ref logic: auth_db.users.id
  author_name       varchar(100) NOT NULL,              -- snapshot để hiển thị, tránh gọi chéo service
  title             varchar(200) NOT NULL,
  description       text         NOT NULL DEFAULT '',
  servings          smallint     NOT NULL DEFAULT 1 CHECK (servings > 0),
  cook_time_minutes integer      NOT NULL DEFAULT 0 CHECK (cook_time_minutes >= 0),
  difficulty        text         NOT NULL DEFAULT 'EASY'
                    CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  calories          integer CHECK (calories IS NULL OR calories >= 0),
  thumbnail_url     text,
  status            text         NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'HIDDEN')),
  rejection_reason  text,
  reviewed_by       uuid,                                -- moderator
  reviewed_at       timestamptz,
  -- số liệu tổng hợp (cập nhật qua event rating.changed, favorite.changed...)
  avg_rating        numeric(3,2) NOT NULL DEFAULT 0 CHECK (avg_rating BETWEEN 0 AND 5),
  rating_count      integer      NOT NULL DEFAULT 0,
  favorite_count    integer      NOT NULL DEFAULT 0,
  comment_count     integer      NOT NULL DEFAULT 0,
  view_count        bigint       NOT NULL DEFAULT 0,
  published_at      timestamptz,
  deleted_at        timestamptz,                         -- xóa mềm
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recipes_author        ON recipes (author_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_status_pub    ON recipes (status, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_rating        ON recipes (avg_rating DESC) WHERE status = 'APPROVED';
CREATE INDEX IF NOT EXISTS idx_recipes_title_trgm    ON recipes USING gin (title gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_recipes_updated_at ON recipes;
CREATE TRIGGER trg_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id       uuid          NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  ingredient_id   uuid          NOT NULL,                -- ref logic: catalog_db.ingredients.id
  ingredient_name varchar(150)  NOT NULL,                -- snapshot tên
  quantity        numeric(10,2) NOT NULL CHECK (quantity > 0),
  unit            varchar(20)   NOT NULL,                -- code đơn vị (g, ml, tbsp...)
  is_optional     boolean       NOT NULL DEFAULT false,
  PRIMARY KEY (recipe_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ing ON recipe_ingredients (ingredient_id);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   uuid     NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  step_order  smallint NOT NULL CHECK (step_order > 0),
  content     text     NOT NULL,
  image_url   text,
  UNIQUE (recipe_id, step_order)
);

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id  uuid NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL,                              -- ref logic: catalog_db.tags.id
  tag_name   varchar(80) NOT NULL,
  PRIMARY KEY (recipe_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags (tag_id);

-- Lịch sử duyệt công thức (audit cho Moderator)
CREATE TABLE IF NOT EXISTS moderation_actions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     uuid        NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  moderator_id  uuid        NOT NULL,
  action        text        NOT NULL CHECK (action IN ('SUBMIT', 'APPROVE', 'REJECT', 'REQUEST_CHANGES', 'HIDE', 'UNHIDE')),
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_moderation_recipe ON moderation_actions (recipe_id, created_at DESC);

-- Nhật ký lượt xem theo ngày (để thống kê cho Chef)
CREATE TABLE IF NOT EXISTS recipe_daily_views (
  recipe_id  uuid    NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  view_date  date    NOT NULL,
  views      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (recipe_id, view_date)
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type text        NOT NULL,
  aggregate_id   text        NOT NULL,
  event_type     text        NOT NULL,                  -- recipe.approved / recipe.updated / recipe.hidden
  payload        jsonb       NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  published_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished
  ON outbox_events (created_at) WHERE published_at IS NULL;

-- Consumer idempotent: lưu event đã xử lý (rating.changed, ingredient.updated...)
CREATE TABLE IF NOT EXISTS processed_events (
  event_id      uuid PRIMARY KEY,
  processed_at  timestamptz NOT NULL DEFAULT now()
);

COMMIT;
