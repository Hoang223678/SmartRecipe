-- =====================================================================
--  INTERACTION_DB  -  script độc lập, copy & chạy ngay
--  Bước 1: chạy 00_create_databases.sql (một lần duy nhất)
--  Bước 2: mở kết nối tới database "interaction_db" rồi chạy toàn bộ file này
--          (psql: psql -U postgres -d interaction_db -f 05_interaction_db.sql)
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TABLE IF NOT EXISTS favorites (
  user_id     uuid        NOT NULL,
  recipe_id   uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)                       -- POST lặp lại không sinh bản ghi trùng
);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe ON favorites (recipe_id);

CREATE TABLE IF NOT EXISTS collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid         NOT NULL,
  name        varchar(100) NOT NULL,
  is_public   boolean      NOT NULL DEFAULT false,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
DROP TRIGGER IF EXISTS trg_collections_updated_at ON collections;
CREATE TRIGGER trg_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS collection_recipes (
  collection_id  uuid        NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
  recipe_id      uuid        NOT NULL,
  added_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS ratings (
  user_id     uuid        NOT NULL,
  recipe_id   uuid        NOT NULL,
  score       smallint    NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)                       -- PUT /recipes/:id/rating = upsert
);
CREATE INDEX IF NOT EXISTS idx_ratings_recipe ON ratings (recipe_id);
DROP TRIGGER IF EXISTS trg_ratings_updated_at ON ratings;
CREATE TRIGGER trg_ratings_updated_at BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE VIEW recipe_rating_stats AS
SELECT recipe_id,
       round(avg(score)::numeric, 2) AS avg_rating,
       count(*)                      AS rating_count
FROM ratings
GROUP BY recipe_id;

CREATE TABLE IF NOT EXISTS comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id    uuid         NOT NULL,
  user_id      uuid         NOT NULL,
  author_name  varchar(100) NOT NULL,                    -- snapshot
  author_avatar text,
  author_role  text         NOT NULL DEFAULT 'USER',
  parent_id    uuid REFERENCES comments (id) ON DELETE CASCADE,
  content      text         NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  status       text         NOT NULL DEFAULT 'VISIBLE' CHECK (status IN ('VISIBLE', 'HIDDEN')),
  hidden_by    uuid,
  hidden_reason text,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_recipe ON comments (recipe_id, created_at DESC) WHERE status = 'VISIBLE';
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user   ON comments (user_id);
DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       uuid        NOT NULL,
  target_type       text        NOT NULL CHECK (target_type IN ('RECIPE', 'COMMENT')),
  target_id         uuid        NOT NULL,
  reason            text        NOT NULL
                    CHECK (reason IN ('SPAM', 'INAPPROPRIATE', 'COPYRIGHT', 'MISLEADING', 'OTHER')),
  note              text,
  status            text        NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
  resolved_by       uuid,
  resolution_action text CHECK (resolution_action IN ('HIDE_CONTENT', 'WARN_USER', 'DISMISS')),
  resolution_note   text,
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports (target_type, target_id);
-- Một người không báo cáo trùng một đối tượng khi báo cáo cũ còn mở
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_open_per_reporter
  ON reports (reporter_id, target_type, target_id) WHERE status = 'OPEN';

-- Tạm khóa quyền bình luận (POST /moderation/users/:id/mute)
CREATE TABLE IF NOT EXISTS user_mutes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  muted_by    uuid        NOT NULL,
  reason      text        NOT NULL,
  muted_until timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mutes_user ON user_mutes (user_id, muted_until DESC);

CREATE TABLE IF NOT EXISTS outbox_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type text        NOT NULL,
  aggregate_id   text        NOT NULL,
  event_type     text        NOT NULL,                  -- rating.changed, comment.created ...
  payload        jsonb       NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  published_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished
  ON outbox_events (created_at) WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS processed_events (
  event_id      uuid PRIMARY KEY,
  processed_at  timestamptz NOT NULL DEFAULT now()
);

COMMIT;
