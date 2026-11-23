#!/usr/bin/env sh

set -eu

port="${TEST_WORKER_PORT:-8788}"
url="http://127.0.0.1:${port}"
log_file="$(mktemp)"
worker_pid=""

# Collect the full pid tree first. wrangler children can be reparented after
# the pnpm parent exits, so later walks would miss them.
collect_tree() {
  _pid="$1"
  [ -n "${_pid}" ] || return 0
  printf "%s\n" "${_pid}"
  if command -v pgrep >/dev/null 2>&1; then
    for _child in $(pgrep -P "${_pid}" 2>/dev/null || true); do
      collect_tree "${_child}"
    done
  fi
}

signal_pids() {
  _sig="$1"
  shift
  for _pid in "$@"; do
    kill -s "${_sig}" "${_pid}" 2>/dev/null || true
  done
}

cleanup() {
  _root="${worker_pid}"
  worker_pid=""
  _pids=""
  if [ -n "${_root}" ]; then
    _pids=$(collect_tree "${_root}")
    # POSIX sh has no arrays; word-split the collected pid list on purpose.
    # shellcheck disable=SC2086
    signal_pids TERM ${_pids}
  fi
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
  fi
  if [ -n "${_pids}" ]; then
    i=0
    while [ "${i}" -lt 5 ]; do
      still=false
      for _pid in ${_pids}; do
        if kill -0 "${_pid}" 2>/dev/null; then
          still=true
          break
        fi
      done
      if [ "${still}" != true ]; then
        break
      fi
      i=$((i + 1))
      sleep 1
    done
    # shellcheck disable=SC2086
    signal_pids KILL ${_pids}
  fi
  # Safety net for children that were reparented before the tree was collected.
  if command -v pkill >/dev/null 2>&1; then
    pkill -f "cloudflare/_worker.js --local --port ${port}" >/dev/null 2>&1 || true
  fi
  rm -f "${log_file}"
}
trap cleanup EXIT INT TERM

if command -v fuser >/dev/null 2>&1 && fuser "${port}/tcp" >/dev/null 2>&1; then
  echo "test-built-worker: port ${port} is already in use. Stop that process and retry." >&2
  exit 1
fi
if curl --fail --silent --max-time 1 "${url}/" >/dev/null 2>&1; then
  echo "test-built-worker: ${url} is already in use. Stop that process and retry." >&2
  exit 1
fi

PORT="${port}" pnpm dev:worker \
  >"${log_file}" 2>&1 &
worker_pid=$!

ready=false
i=0
while [ "${i}" -lt 60 ]; do
  if curl --fail --silent --max-time 1 "${url}/" >/dev/null 2>&1; then
    ready=true
    break
  fi
  if ! kill -0 "${worker_pid}" 2>/dev/null; then
    cat "${log_file}" >&2
    exit 1
  fi
  i=$((i + 1))
  sleep 1
done

if [ "${ready}" != true ]; then
  cat "${log_file}" >&2
  echo "test-built-worker: Worker did not become ready at ${url} within 60s." >&2
  exit 1
fi

VITE_HELLO_WORLD_URL="${url}" pnpm test
