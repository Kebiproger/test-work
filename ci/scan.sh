#!/bin/sh
# Secret scan with gitleaks over the git repository. Secret values are redacted.
# Uses a local gitleaks binary when it has the pinned version, else the pinned Docker image.
# Uses .gitleaks.toml at the repo root when present (narrow allowlist, see that file).
# The Docker path mounts the repo read-only; gitleaks writes no report (no --report-path).
set -eu
cd "$(dirname "$0")/.."
# shellcheck source=ci/versions.env
. ./ci/versions.env
# shellcheck source=ci/common.sh
. ./ci/common.sh

config_arg=""
if [ -f "$PWD/.gitleaks.toml" ]; then
  config_arg="--config $PWD/.gitleaks.toml"
  echo "== using .gitleaks.toml"
fi

if local_tool_ok gitleaks "$GITLEAKS_VERSION"; then
  echo "== gitleaks (local $GITLEAKS_VERSION)"
  # shellcheck disable=SC2086
  GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0="$PWD" \
    gitleaks detect --source "$PWD" --redact --no-banner $config_arg --exit-code 1
else
  command -v docker >/dev/null 2>&1 || die "docker is required for make scan (or install gitleaks $GITLEAKS_VERSION locally)"
  config_arg=""
  if [ -f "$PWD/.gitleaks.toml" ]; then
    config_arg="--config /repo/.gitleaks.toml"
  fi
  echo "== gitleaks ($GITLEAKS_IMAGE)"
  # shellcheck disable=SC2086
  docker run --rm \
    -v "$PWD:/repo:ro" -w /repo \
    -e GIT_CONFIG_COUNT=1 -e GIT_CONFIG_KEY_0=safe.directory -e GIT_CONFIG_VALUE_0=/repo \
    "$GITLEAKS_IMAGE" \
    detect --source /repo --redact --no-banner $config_arg --exit-code 1
fi

echo "scan: OK"
