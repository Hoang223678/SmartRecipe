FROM postgres:16

COPY infra/docker/postgres/01-apply-schemas.sh /docker-entrypoint-initdb.d/01-apply-schemas.sh
COPY db/00_create_databases.sql /docker-entrypoint-initdb.d/00-create-databases.sql
COPY db /schemas

RUN chmod +x /docker-entrypoint-initdb.d/01-apply-schemas.sh \
  && sed -i 's/\r$//' /docker-entrypoint-initdb.d/01-apply-schemas.sh
