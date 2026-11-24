#!/bin/sh
# Push the backend and frontend images built by ci/build.sh to ${REGISTRY}.
set -eu
cd "$(dirname "$0")/.."
# shellcheck source=ci/common.sh
. ./ci/common.sh

validate_registry
validate_tag
command -v docker >/dev/null 2>&1 || die "docker is required for make push"

for svc in backend frontend; do
  image="$REGISTRY/$APP-$svc:$TAG"
  docker image inspect "$image" >/dev/null 2>&1 || die "image $image not found locally. Run make build first."
  echo "== pushing $image"
  docker push "$image"
done

echo "push: OK"
