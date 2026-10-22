-- =====================================================================
--  PLANNER_DB  -  script độc lập, copy & chạy ngay
--  Bước 1: chạy 00_create_databases.sql (một lần duy nhất)
--  Bước 2: mở kết nối tới database "planner_db" rồi chạy toàn bộ file này
--          (psql: psql -U postgres -d planner_db -f 06_planner_db.sql)
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TABLE IF NOT EXISTS meal_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  week_start  date        NOT NULL,                      -- ngày thứ Hai đầu tuần
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
DROP TRIGGER IF EXISTS trg_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER trg_meal_plans_updated_at BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS meal_plan_entries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id   uuid         NOT NULL REFERENCES meal_plans (id) ON DELETE CASCADE,
  plan_date      date         NOT NULL,
  meal_type      text         NOT NULL CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
  recipe_id      uuid         NOT NULL,                  -- ref logic: recipe_db.recipes.id
  recipe_title   varchar(200) NOT NULL,                  -- snapshot
  thumbnail_url  text,
  servings       smallint     NOT NULL DEFAULT 1 CHECK (servings > 0)
);
CREATE INDEX IF NOT EXISTS idx_mpe_plan ON meal_plan_entries (meal_plan_id, plan_date);

CREATE TABLE IF NOT EXISTS shopping_lists (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL,
  meal_plan_id  uuid REFERENCES meal_plans (id) ON DELETE SET NULL,
  title         varchar(150),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid          NOT NULL REFERENCES shopping_lists (id) ON DELETE CASCADE,
  ingredient_id  uuid           NOT NULL,
  name           varchar(150)   NOT NULL,
  quantity       numeric(10,2)  NOT NULL CHECK (quantity > 0),
  unit           varchar(20)    NOT NULL,
  checked        boolean        NOT NULL DEFAULT false,
  UNIQUE (shopping_list_id, ingredient_id, unit)
);

CREATE TABLE IF NOT EXISTS processed_events (
  event_id      uuid PRIMARY KEY,
  processed_at  timestamptz NOT NULL DEFAULT now()
);

COMMIT;
