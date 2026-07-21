#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

log() { printf '\n[%s] %s\n' "$1" "$2"; }
die() { printf '\n[ERROR] %s\n' "$1" >&2; exit 1; }

ensure_env() {
  if [[ ! -f .env ]]; then
    [[ -f .env.example ]] || die ".env.example is missing from the repository root."
    log "1/8" "Creating the root .env file from .env.example..."
    cp .env.example .env
  fi
  local key
  for key in POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD POSTGRES_PORT PRISM_DATABASE_URL; do
    grep -q "^${key}=" .env || die ".env is missing ${key}. Restore it from .env.example and try again."
  done
}

install_brew_package() {
  command -v brew >/dev/null 2>&1 || die "Homebrew is required to install $1. Install Homebrew, then run this file again."
  brew install "$1"
}

ensure_docker() {
  log "2/8" "Checking Docker Desktop..."
  if ! command -v docker >/dev/null 2>&1; then
    if [[ "$(uname -s)" == "Darwin" ]]; then
      command -v brew >/dev/null 2>&1 || die "Docker is missing. Install Docker Desktop or Homebrew, then run this file again."
      brew install --cask docker
    elif command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update
      sudo apt-get install -y docker.io docker-compose-plugin
    else
      die "Docker is missing and this operating system has no supported package manager. Install Docker Desktop, then run this file again."
    fi
  fi

  if [[ "$(uname -s)" == "Darwin" ]]; then
    open -a Docker >/dev/null 2>&1 || true
  elif command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start docker >/dev/null 2>&1 || true
  fi

  printf 'Waiting for Docker to become ready'
  for _ in {1..90}; do
    if docker info >/dev/null 2>&1; then
      printf ' ready.\n'
      docker compose version >/dev/null 2>&1 || die "Docker Compose is unavailable. Update Docker Desktop and run this file again."
      return
    fi
    printf '.'
    sleep 2
  done
  printf '\n'
  die "Docker did not become ready within 3 minutes. Complete any Docker Desktop first-run prompts, then run this file again."
}

ensure_python() {
  log "3/8" "Checking Python 3.11+..."
  PYTHON_CMD=""
  for candidate in python3.12 python3 python; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)' >/dev/null 2>&1; then
      PYTHON_CMD="$candidate"
      break
    fi
  done
  if [[ -z "$PYTHON_CMD" ]]; then
    if [[ "$(uname -s)" == "Darwin" ]]; then
      install_brew_package python@3.12
      export PATH="$(brew --prefix python@3.12)/bin:$PATH"
      PYTHON_CMD=python3.12
    elif command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update
      sudo apt-get install -y python3 python3-venv python3-pip
      PYTHON_CMD=python3
    else
      die "Python 3.11+ is missing. Install it, then run this file again."
    fi
  fi
  "$PYTHON_CMD" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)' || die "Python 3.11+ is required."
}

ensure_node() {
  log "4/8" "Checking Node.js and npm..."
  if ! command -v npm >/dev/null 2>&1; then
    if [[ "$(uname -s)" == "Darwin" ]]; then
      install_brew_package node
    elif command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update
      sudo apt-get install -y nodejs npm
    else
      die "Node.js and npm are missing. Install Node.js LTS, then run this file again."
    fi
  fi
  command -v npm >/dev/null 2>&1 || die "npm is still unavailable after installation. Restart the terminal and run this file again."
}

start_database() {
  log "5/8" "Downloading and starting PostgreSQL and Redis..."
  docker compose pull postgres redis || log "warning" "Container image pull failed, attempting startup with cached images..."
  if ! docker compose up -d postgres redis; then
    docker compose logs --tail=40 postgres || true
    die "PostgreSQL / Redis containers failed to start."
  fi
}

setup_backend() {
  log "6/8" "Creating the backend virtual environment and installing dependencies..."
  VENV_DIR="$ROOT_DIR/backend/.venv"
  BACKEND_PYTHON="$VENV_DIR/bin/python"
  if [[ ! -x "$BACKEND_PYTHON" ]]; then
    "$PYTHON_CMD" -m venv "$VENV_DIR"
  fi
  "$BACKEND_PYTHON" -m pip install --upgrade pip
  (cd "$ROOT_DIR/backend" && "$BACKEND_PYTHON" -m pip install -e '.[dev]')
}

initialize_database() {
  log "database" "Initializing PostgreSQL schema and idempotent seed data..."
  (cd "$ROOT_DIR/backend" && "$BACKEND_PYTHON" -c 'from app.database import initialize_database; initialize_database()')
}

setup_frontend() {
  log "7/8" "Installing frontend dependencies..."
  if [[ -f "$ROOT_DIR/frontend/package-lock.json" ]]; then
    (cd "$ROOT_DIR/frontend" && npm ci --no-audit --no-fund)
  else
    (cd "$ROOT_DIR/frontend" && npm install --no-audit --no-fund)
  fi
}

setup_sidecar() {
  log "8/8" "Installing and updating FlowWatch sidecar dependencies..."
  (cd "$ROOT_DIR/flowwatch-sidecar" && npm install --no-audit --no-fund && npm install @pranshulsoni/flowwatch@latest --no-audit --no-fund)
}

verify_project() {
  log "verify" "Running backend tests and the frontend test/build checks..."
  (cd "$ROOT_DIR/backend" && "$BACKEND_PYTHON" -m pytest)
  (cd "$ROOT_DIR/frontend" && npm test -- --reporter=dot)
  (cd "$ROOT_DIR/frontend" && npm run build)
}

ensure_env
ensure_docker
ensure_python
ensure_node
start_database
setup_backend
initialize_database
setup_frontend
setup_sidecar
verify_project

printf '\n=========================================\nPRISM setup complete and verified!\n\nTo start the development servers, run:\n  ./run-dev.sh\n=========================================\n'
