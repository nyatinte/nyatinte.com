#!/usr/bin/env sh
set -eu

APP_ENV=production
CF_SEND_TELEMETRY="${CF_SEND_TELEMETRY:-false}"
export APP_ENV CF_SEND_TELEMETRY

cd "$(dirname "$0")/.."
pnpm build

tag="${DEPLOY_VERSION_TAG:-}"
if [ -z "$tag" ]; then
  commit=$(git rev-parse HEAD 2>/dev/null || printf 'unknown')
  tag="$commit-$(node -p 'crypto.randomUUID()')"
fi
output_file="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/wrangler-versions-upload.jsonl"
rm -f "$output_file"

WRANGLER_OUTPUT_FILE_PATH="$output_file" varlock-wrangler versions upload --keep-vars=true --tag "$tag"
if [ ! -s "$output_file" ]; then
  echo "アップロード出力ファイルがありません、または空です: $output_file" >&2
  exit 1
fi
if ! version_id=$(node scripts/parse-wrangler-version-id.mjs "$output_file"); then
  echo "アップロード出力から Version ID を取得できませんでした。出力内容:" >&2
  cat "$output_file" >&2
  exit 1
fi

echo "Version ID: $version_id (tag: $tag)"
wrangler versions deploy --version-id "$version_id" --yes
