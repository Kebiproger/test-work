#!/bin/sh
# Run backend/frontend tests. Today the project has no tests, so this exits 0.
# If test files appear without a configured runner, this fails on purpose so that
# tests are never silently skipped.
set -eu
cd "$(dirname "$0")/.."

found=$(find backend frontend \( -name node_modules -o -name .venv \) -prune -o \
  \( -name 'test_*.py' -o -name '*_test.py' -o -name '*.test.*' -o -name '*.spec.*' \) -print 2>/dev/null | head -n 5)

if [ -z "$found" ]; then
  echo "no tests configured"
  exit 0
fi

echo "ERROR: test files found but no test runner is configured in ci/test.sh:" >&2
printf '%s\n' "$found" >&2
echo "Add a runner for backend/frontend in ci/test.sh (see ci/README.md)." >&2
exit 1
