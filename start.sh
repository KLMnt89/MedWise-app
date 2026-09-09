#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

mkdir -p logs

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example to .env and set GEMINI_API_KEY (optional for local fallback)."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [[ -f .backend.pid ]] && kill -0 "$(cat .backend.pid)" 2>/dev/null; then
  echo "Backend already running (pid $(cat .backend.pid))"
else
  echo "Starting Spring Boot on port ${SERVER_PORT:-8080}..."
  nohup ./mvnw -q spring-boot:run > logs/backend.log 2>&1 &
  echo $! > .backend.pid
fi

if [[ -d app ]]; then
  if [[ -f .app.pid ]] && kill -0 "$(cat .app.pid)" 2>/dev/null; then
    echo "Expo already running (pid $(cat .app.pid))"
  else
    echo "Starting Expo app..."
    (
      cd app
      if [[ ! -d node_modules ]]; then
        npm install
      fi
      nohup npx expo start --web > ../logs/app.log 2>&1 &
      echo $! > ../.app.pid
    )
  fi
fi

echo "Logs: logs/backend.log and logs/app.log"
echo "Stop with ./stop.sh"
