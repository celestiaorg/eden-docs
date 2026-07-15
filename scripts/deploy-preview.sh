#!/usr/bin/env bash
set -euo pipefail

workflow_file="deploy-cloudflare.yml"
workflow_name="Deploy to Cloudflare Pages"
base_ref="main"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh is required to dispatch the Cloudflare Pages preview workflow." >&2
  exit 1
fi

branch="$(git symbolic-ref --quiet --short HEAD || true)"

if [[ -z "$branch" ]]; then
  echo "Refusing to deploy a preview from a detached HEAD." >&2
  exit 1
fi

if [[ "$branch" == "$base_ref" ]]; then
  echo "Refusing to deploy main as a preview; pushes to main deploy production." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Refusing to deploy a dirty workspace. Commit or stash changes first." >&2
  exit 1
fi

repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

echo "Pushing $branch to origin..."
git push -u origin "HEAD:refs/heads/$branch"

echo "Dispatching $workflow_name on $base_ref with preview_ref=$branch..."
run_output="$(gh workflow run "$workflow_file" --repo "$repo" --ref "$base_ref" -f "preview_ref=$branch" 2>&1)"
printf '%s\n' "$run_output"

run_url="$(printf '%s\n' "$run_output" | sed -nE 's#.*(https://github.com/[^ ]+/actions/runs/[0-9]+).*#\1#p' | tail -n 1)"

if [[ -n "$run_url" ]]; then
  run_id="${run_url##*/}"
else
  echo "Waiting for GitHub to create the workflow run..."
  sleep 5
  run_id="$(gh run list \
    --repo "$repo" \
    --workflow "$workflow_name" \
    --event workflow_dispatch \
    --branch "$base_ref" \
    --limit 1 \
    --json databaseId \
    --jq '.[0].databaseId')"
fi

if [[ -z "$run_id" ]]; then
  echo "Could not find the dispatched workflow run." >&2
  exit 1
fi

if ! gh run watch "$run_id" --repo "$repo" --exit-status; then
  echo "Workflow failed. Failed-step logs:" >&2
  gh run view "$run_id" --repo "$repo" --log-failed >&2 || true
  exit 1
fi

alias_url="$(gh run view "$run_id" --repo "$repo" --log | sed -nE 's/.*Deployment alias URL: (https:\/\/[^[:space:]]+).*/\1/p' | tail -n 1)"

if [[ -n "$alias_url" ]]; then
  echo "Cloudflare Pages preview: $alias_url"
else
  echo "Workflow completed. Open the run for the preview URL:"
  gh run view "$run_id" --repo "$repo" --json url --jq .url
fi
