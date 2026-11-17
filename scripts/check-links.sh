#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
report="$(mktemp)"
trap 'rm -f "$report"' EXIT

# Lychee 0.24.2 does not retry HTTP 503 responses, so retry the strict check.
for attempt in 1 2 3; do
  status=0
  lychee --config ./lychee.toml --format markdown --output "$report" "$@" || status=$?
  cat "$report"
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    cat "$report" > "$GITHUB_STEP_SUMMARY"
  fi

  if [[ "$status" -eq 0 ]]; then
    if ! grep -Eq 'Total[[:space:]]+\|[[:space:]]+[1-9][0-9]*[[:space:]]*\|' "$report"; then
      echo "No links were checked; refusing to pass an empty scan." >&2
      exit 1
    fi
    exit 0
  fi

  [[ "$status" -eq 2 && "$attempt" -lt 3 ]] || exit "$status"
  echo "Link check failed (attempt $attempt/3); retrying in $((attempt * 10)) seconds." >&2
  sleep "$((attempt * 10))"
done
