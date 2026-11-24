#!/bin/sh
# Shared helpers for ci/*.sh. Sourced, never executed directly.
# Contract: REGISTRY (registry host + path), APP (default flower), TAG (sha-<7..40 hex>).
# shellcheck shell=sh

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

# require_var NAME: fail with a clear message when the variable is unset or empty.
require_var() {
  eval "_rv_value=\${$1:-}"
  if [ -z "$_rv_value" ]; then
    die "$1 is not set. See the contract in ci/README.md (e.g. make build REGISTRY=ghcr.io/owner APP=flower TAG=sha-1234567)."
  fi
}

# validate_tag: TAG must be sha-<7..40 lowercase hex>, matched against the whole value.
validate_tag() {
  require_var TAG
  _vt_lines=$(printf '%s' "$TAG" | wc -l | tr -d ' ')
  if [ "$_vt_lines" != "0" ] || ! printf '%s\n' "$TAG" | grep -Eqx 'sha-[0-9a-f]{7,40}'; then
    die "TAG '$TAG' is invalid. Expected sha-<7 to 40 lowercase hex chars>, e.g. sha-1234567. floating tags are not allowed."
  fi
}

# validate_registry: REGISTRY must be lowercase, no spaces, e.g. ghcr.io/owner or local/test.
validate_registry() {
  require_var REGISTRY
  if ! printf '%s\n' "$REGISTRY" | grep -Eqx '[a-z0-9][a-z0-9._:/-]*'; then
    die "REGISTRY '$REGISTRY' is invalid. Use lowercase registry/path, e.g. ghcr.io/owner."
  fi
}

# Default APP when the caller does not set it.
APP="${APP:-flower}"
export APP

# local_tool_ok CMD EXPECTED_VERSION: success when CMD is on PATH and reports exactly EXPECTED_VERSION.
# Used by lint.sh and scan.sh to decide between a local binary and the pinned Docker image.
local_tool_ok() {
  command -v "$1" >/dev/null 2>&1 || return 1
  case "$1" in
    shellcheck) _ltv=$(shellcheck --version 2>/dev/null | sed -n 's/^version: //p') ;;
    actionlint) _ltv=$(actionlint -version 2>/dev/null | sed -n '1p') ;;
    gitleaks) _ltv=$(gitleaks version 2>/dev/null | sed -n '1p') ;;
    *) return 1 ;;
  esac
  [ "$_ltv" = "$2" ]
}
