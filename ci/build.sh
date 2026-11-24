#!/bin/sh
# Build backend and frontend images as ${REGISTRY}/${APP}-{backend,frontend}:${TAG}.
set -eu
cd "$(dirname "$0")/.."
# shellcheck source=ci/common.sh
. ./ci/common.sh

validate_registry
validate_tag
command -v docker >/dev/null 2>&1 || die "docker is required for make build"

for svc in backend frontend; do
  image="$REGISTRY/$APP-$svc:$TAG"
  echo "== building $image"
  docker build -t "$image" "./$svc"
done

echo "build: OK"
docker image ls --filter "reference=$REGISTRY/$APP-*:$TAG"
