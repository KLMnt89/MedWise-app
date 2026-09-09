#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

stop_pidfile() {
  local file="$1"
  if [[ -f "$file" ]]; then
    local pid
    pid="$(cat "$file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$file"
  fi
}

stop_pidfile .backend.pid
stop_pidfile .app.pid

# Catch leftovers even if start.sh was not used
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "com.medwise.medwise.MedwiseApplication" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

echo "Stopped MedWise processes."
