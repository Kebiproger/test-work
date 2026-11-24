#!/bin/sh
# Lint shell scripts (shellcheck) and GitHub workflows (actionlint).
# Uses a local binary when it has the pinned version, else the pinned Docker image.
set -eu
cd "$(dirname "$0")/.."
# shellcheck source=ci/versions.env
. ./ci/versions.env
# shellcheck source=ci/common.sh
. ./ci/common.sh

set --
for f in ci/*.sh scripts/*.sh; do
  [ -f "$f" ] && set -- "$@" "$f"
done

if local_tool_ok shellcheck "$SHELLCHECK_VERSION"; then
  echo "== shellcheck (local $SHELLCHECK_VERSION)"
  shellcheck -x "$@"
else
  command -v docker >/dev/null 2>&1 || die "docker is required for make lint (or install shellcheck $SHELLCHECK_VERSION locally)"
  echo "== shellcheck ($SHELLCHECK_IMAGE)"
  docker run --rm --entrypoint shellcheck -v "$PWD:/mnt:ro" -w /mnt "$SHELLCHECK_IMAGE" -x "$@"
fi

if local_tool_ok actionlint "$ACTIONLINT_VERSION"; then
  echo "== actionlint (local $ACTIONLINT_VERSION)"
  actionlint .github/workflows/*.yml
else
  command -v docker >/dev/null 2>&1 || die "docker is required for make lint (or install actionlint $ACTIONLINT_VERSION locally)"
  echo "== actionlint ($ACTIONLINT_IMAGE)"
  docker run --rm -v "$PWD:/repo:ro" -w /repo "$ACTIONLINT_IMAGE" .github/workflows/*.yml
fi

echo "lint: OK"
