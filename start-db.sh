#!/usr/bin/env bash
# Levanta el contenedor MySQL para el examen, probando varias formas de
# Docker Compose disponibles y usando `docker run` como última opción
# (útil si el equipo no tiene el plugin `docker compose` instalado, o si su
# `docker-compose` standalone está roto, algo sorprendentemente común).
set -uo pipefail
cd "$(dirname "$0")"

[ -f .env ] || cp .env.example .env
set -a
source .env
set +a

DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-rootpass}"
DB_USER="${DB_USER:-baloncesto}"
DB_PASSWORD="${DB_PASSWORD:-baloncesto}"
DB_PORT="${DB_PORT:-3307}"

started=false

if docker compose version >/dev/null 2>&1; then
  echo "Usando 'docker compose' (plugin v2)..."
  if docker compose up -d; then
    started=true
  else
    echo "'docker compose up -d' falló; probando otras opciones..." >&2
  fi
fi

if [ "$started" = false ] && command -v docker-compose >/dev/null 2>&1; then
  echo "Usando 'docker-compose' (standalone v1)..."
  if docker-compose up -d; then
    started=true
  else
    echo "'docker-compose up -d' falló (versión rota o incompatible); probando 'docker run' directamente..." >&2
  fi
fi

if [ "$started" = false ]; then
  echo "Arrancando el contenedor con 'docker run' directamente..."
  docker rm -f baloncesto_mesa_db >/dev/null 2>&1 || true
  docker run -d --name baloncesto_mesa_db \
    --restart unless-stopped \
    -e MYSQL_ROOT_PASSWORD="$DB_ROOT_PASSWORD" \
    -e MYSQL_DATABASE=baloncesto_examen \
    -e MYSQL_USER="$DB_USER" \
    -e MYSQL_PASSWORD="$DB_PASSWORD" \
    -p "$DB_PORT":3306 \
    -v baloncesto_db_data:/var/lib/mysql \
    -v "$(pwd)/database/schema.sql":/docker-entrypoint-initdb.d/01-schema.sql:ro \
    mysql:8.0
  if [ $? -ne 0 ]; then
    echo "No se pudo arrancar el contenedor MySQL con ningún método. Revisa que Docker esté instalado y corriendo (¿'docker ps' funciona?)." >&2
    exit 1
  fi
fi

echo "Esperando a que MySQL acepte conexiones en el puerto $DB_PORT..."
for i in $(seq 1 30); do
  if docker exec baloncesto_mesa_db mysqladmin ping -h localhost -uroot -p"$DB_ROOT_PASSWORD" --silent 2>/dev/null; then
    echo "MySQL listo."
    exit 0
  fi
  sleep 2
done
echo "MySQL no respondió a tiempo; revisa 'docker logs baloncesto_mesa_db'." >&2
exit 1
