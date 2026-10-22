-- =====================================================================
--  00_create_databases.sql
--  Tạo 7 database cho 7 microservice. Chạy 1 lần bằng user có quyền
--  CREATE DATABASE (vd: postgres), kết nối vào database mặc định "postgres".
--  Nếu database đã tồn tại sẽ báo lỗi "already exists": bỏ qua dòng đó.
-- =====================================================================
CREATE DATABASE auth_db           ENCODING 'UTF8';
CREATE DATABASE catalog_db        ENCODING 'UTF8';
CREATE DATABASE recipe_db         ENCODING 'UTF8';
CREATE DATABASE recommendation_db ENCODING 'UTF8';
CREATE DATABASE interaction_db    ENCODING 'UTF8';
CREATE DATABASE planner_db        ENCODING 'UTF8';
CREATE DATABASE media_db          ENCODING 'UTF8';
