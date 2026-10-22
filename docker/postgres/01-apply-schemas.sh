#!/bin/bash
set -euo pipefail

echo "Applying microservice schemas..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname auth_db           -f /schemas/01_auth_db.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname catalog_db        -f /schemas/02_catalog_db.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname recipe_db         -f /schemas/03_recipe_db.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname recommendation_db -f /schemas/04_recommendation_db.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname interaction_db    -f /schemas/05_interaction_db.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname planner_db        -f /schemas/06_planner_db.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname media_db          -f /schemas/07_media_db.sql

echo "All microservice schemas applied."
