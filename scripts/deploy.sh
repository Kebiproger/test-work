#!/bin/sh
set -eu 
: "${DEPLOY_DIR:?must be set}"
: "${TAG:?must be set}"
: "${IMAGE_PREFIX:?must be set}"
export TAG IMAGE_PREFIX

case "$TAG" in
  sha-[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]*) ;;
  *) echo "bad TAG: $TAG" >&2; exit 1 ;;
esac


if [ -n "${REGISTRY_TOKEN:-}" ]; then
  printf '%s' "$REGISTRY_TOKEN" | docker login ghcr.io -u "${REGISTRY_USER:?}" --password-stdin
fi

# Держим compose-файл в DEPLOY_DIR синхронным с репозиторием (скрипт запускается из чекаута)
cp docker-compose.yml "$DEPLOY_DIR/docker-compose.yml"

cd "$DEPLOY_DIR"
docker compose pull
docker compose up -d
docker image prune -f
