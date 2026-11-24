#!/bin/sh
# Deploy ${REGISTRY}/${APP}-*:${TAG} on this host using docker-compose.yml copied to DEPLOY_DIR.
# Required: DEPLOY_DIR (absolute path, must exist and contain .env), REGISTRY, TAG.
# Optional: APP (default flower),
# REGISTRY_USER + REGISTRY_TOKEN (registry login; the token is passed via stdin only).
set -eu
cd "$(dirname "$0")/.."
# shellcheck source=ci/common.sh
. ./ci/common.sh

require_var DEPLOY_DIR
case "$DEPLOY_DIR" in
  /*) ;;
  *) die "DEPLOY_DIR '$DEPLOY_DIR' must be an absolute path (e.g. /srv/flower)." ;;
esac
[ -d "$DEPLOY_DIR" ] || die "DEPLOY_DIR '$DEPLOY_DIR' does not exist. Create it on the VM first."
[ -f "$DEPLOY_DIR/.env" ] || die "$DEPLOY_DIR/.env is missing. Create it on the host with the runtime secrets (see .env.example); deploy does not create it."
validate_registry
validate_tag
command -v docker >/dev/null 2>&1 || die "docker is required for make deploy"

if [ -n "${REGISTRY_TOKEN:-}" ]; then
  require_var REGISTRY_USER
  # Host = first path segment of REGISTRY, e.g. ghcr.io from ghcr.io/owner.
  REGISTRY_HOST="${REGISTRY%%/*}"
  case "$REGISTRY_HOST" in
    *.*|*:*) ;;
    *) die "REGISTRY '$REGISTRY' must start with a registry host (e.g. ghcr.io/owner) to log in." ;;
  esac
  trap 'docker logout "$REGISTRY_HOST" >/dev/null 2>&1 || true' EXIT
  printf '%s' "$REGISTRY_TOKEN" | docker login "$REGISTRY_HOST" -u "$REGISTRY_USER" --password-stdin
fi

# Keep the compose file in DEPLOY_DIR in sync with the repository checkout.
cp docker-compose.yml "$DEPLOY_DIR/docker-compose.yml"

export REGISTRY APP TAG
cd "$DEPLOY_DIR"
docker compose pull
docker compose up -d
docker image prune -f

echo "deploy: OK ($REGISTRY/$APP-*:$TAG)"
