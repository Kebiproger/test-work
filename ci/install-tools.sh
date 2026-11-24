#!/bin/sh
# Install pinned lint/scan tools into /usr/local/bin for CI jobs without Docker (GitLab `check`).
# Needs: sh, curl, tar, sha256sum (busybox ok), root or write access to /usr/local/bin.
# Every download is checked against the SHA256 pinned in ci/versions.env before extraction.
set -eu
cd "$(dirname "$0")/.."
# shellcheck source=ci/versions.env
. ./ci/versions.env
# shellcheck source=ci/common.sh
. ./ci/common.sh

BIN_DIR="${BIN_DIR:-/usr/local/bin}"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# fetch_verified URL SHA256 OUT: download and verify; fail hard on mismatch.
fetch_verified() {
  curl -fsSL --retry 3 -o "$3" "$1"
  if ! printf '%s  %s\n' "$2" "$3" | sha256sum -c - >/dev/null 2>&1; then
    die "sha256 mismatch for $1"
  fi
  echo "verified: $1"
}

base=https://github.com

echo "== shellcheck $SHELLCHECK_VERSION"
fetch_verified "$base/koalaman/shellcheck/releases/download/v$SHELLCHECK_VERSION/shellcheck-v$SHELLCHECK_VERSION.linux.x86_64.tar.gz" \
  "$SHELLCHECK_SHA256" "$WORK/shellcheck.tar.gz"
tar -xzf "$WORK/shellcheck.tar.gz" -C "$WORK" "shellcheck-v$SHELLCHECK_VERSION/shellcheck"
install -m 0755 "$WORK/shellcheck-v$SHELLCHECK_VERSION/shellcheck" "$BIN_DIR/shellcheck"

echo "== actionlint $ACTIONLINT_VERSION"
fetch_verified "$base/rhysd/actionlint/releases/download/v$ACTIONLINT_VERSION/actionlint_${ACTIONLINT_VERSION}_linux_amd64.tar.gz" \
  "$ACTIONLINT_SHA256" "$WORK/actionlint.tar.gz"
tar -xzf "$WORK/actionlint.tar.gz" -C "$WORK" actionlint
install -m 0755 "$WORK/actionlint" "$BIN_DIR/actionlint"

echo "== gitleaks $GITLEAKS_VERSION"
fetch_verified "$base/gitleaks/gitleaks/releases/download/v$GITLEAKS_VERSION/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
  "$GITLEAKS_SHA256" "$WORK/gitleaks.tar.gz"
tar -xzf "$WORK/gitleaks.tar.gz" -C "$WORK" gitleaks
install -m 0755 "$WORK/gitleaks" "$BIN_DIR/gitleaks"

# Confirm the installed versions match the pins (local_tool_ok is the same check lint/scan use).
PATH="$BIN_DIR:$PATH"
export PATH
local_tool_ok shellcheck "$SHELLCHECK_VERSION" || die "installed shellcheck is not $SHELLCHECK_VERSION"
local_tool_ok actionlint "$ACTIONLINT_VERSION" || die "installed actionlint is not $ACTIONLINT_VERSION"
local_tool_ok gitleaks "$GITLEAKS_VERSION" || die "installed gitleaks is not $GITLEAKS_VERSION"
echo "install-tools: OK"
