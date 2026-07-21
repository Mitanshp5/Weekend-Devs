#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

log() { printf '\n[%s] %s\n' "$1" "$2"; }
die() { printf '\n[ERROR] %s\n' "$1" >&2; exit 1; }

# 1. Verify and source environment
if [[ ! -f .env ]]; then
  die "The root .env file is missing. Please run ./setup.sh first!"
fi

# Load variables
set -a
source .env
set +a

# 2. Check if setup was completed
if [[ ! -d "backend/.venv" ]]; then
  die "backend/.venv is missing. Please run ./setup.sh first!"
fi
if [[ ! -d "frontend/node_modules" ]]; then
  die "frontend/node_modules is missing. Please run ./setup.sh first!"
fi
if [[ ! -d "flowwatch-sidecar/node_modules" ]]; then
  die "flowwatch-sidecar/node_modules is missing. Please run ./setup.sh first!"
fi

# 3. Check Docker status
if ! command -v docker >/dev/null 2>&1; then
  die "Docker command is missing. Please install and start Docker Desktop."
fi

if ! docker info >/dev/null 2>&1; then
  log "docker" "Docker daemon is not running. Starting Docker Desktop..."
  if [[ "$(uname -s)" == "Darwin" ]]; then
    open -a Docker >/dev/null 2>&1 || true
  elif command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start docker >/dev/null 2>&1 || true
  fi

  printf 'Waiting for Docker to become ready'
  for _ in {1..45}; do
    if docker info >/dev/null 2>&1; then
      printf ' ready.\n'
      break
    fi
    printf '.'
    sleep 2
  done
  printf '\n'
  docker info >/dev/null 2>&1 || die "Docker did not start in time. Make sure it is running and try again."
fi

# 4. Start PostgreSQL and Redis containers
log "database" "Starting PostgreSQL and Redis containers..."
docker compose up -d postgres redis

# 5. Launch Backend, Frontend, and FlowWatch sidecar dev servers
log "start" "Starting the backend, frontend, and sidecar dev servers..."
BACKEND_PYTHON="$ROOT_DIR/backend/.venv/bin/python"

(cd "$ROOT_DIR/backend" && exec "$BACKEND_PYTHON" -m uvicorn app.main:app --reload) &
BACKEND_PID=$!
(cd "$ROOT_DIR/frontend" && exec npm run dev) &
FRONTEND_PID=$!
(cd "$ROOT_DIR/flowwatch-sidecar" && exec npm start) &
SIDECAR_PID=$!

cleanup() {
  printf '\nStopping development servers...\n'
  kill "$BACKEND_PID" "$FRONTEND_PID" "$SIDECAR_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# 6. Health check wait
HEALTH_OK=0
for _ in {1..30}; do
  if curl --silent --fail http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
    if curl --silent --fail http://127.0.0.1:9400/api/health >/dev/null 2>&1; then
      HEALTH_OK=1
      break
    fi
  fi
  sleep 1
done

if [[ "$HEALTH_OK" -eq 0 ]]; then
  die "The backend or FlowWatch sidecar health check did not respond."
fi

# 7. Seeding is handled automatically by initialize_database() on first startup

# 8. Clear Redis auth rate-limit counters (dev only — prevents 429 on login after restarts)
log "seed" "Clearing auth rate-limit counters..."
docker compose exec -T redis redis-cli DEL "rate_limit:login:::1" "rate_limit:register:::1" >/dev/null 2>&1 || true

printf '\n=========================================\nPRISM is running!\nFrontend:          http://localhost:5173\nBackend:           http://127.0.0.1:8000\nAPI docs:          http://127.0.0.1:8000/docs\nFlowWatch Sidecar: http://localhost:9400\nFlowWatch Ops:     http://localhost:9400/ops\n\nPress Ctrl+C to stop all servers.\n=========================================\n'
wait

