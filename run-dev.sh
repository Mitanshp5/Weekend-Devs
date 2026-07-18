#!/usr/bin/env bash

echo "========================================="
echo "       PRISM Dev Environment Launcher    "
echo "========================================="

# Auto-create .env from .env.example if missing
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "[WARNING] .env file not found. Copying .env.example to .env..."
        cp .env.example .env
    else
        echo "[ERROR] Neither .env nor .env.example was found in the root directory!"
        exit 1
    fi
fi

# Detect Python
PYTHON_CMD=""
for cmd in py python python3; do
    if command -v "$cmd" &> /dev/null; then
        # Verify it runs and is not the empty Windows Store alias
        if "$cmd" --version &> /dev/null; then
            PYTHON_CMD=$(which "$cmd")
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    # Search standard Windows installation folders (if in Git Bash/WSL/Windows environment)
    UPATH=$(pwd -P)
    if [ -n "$USERPROFILE" ]; then
        UPATH=$(echo "$USERPROFILE" | sed 's/\\/\//g' | sed -r 's/^([A-Za-z]):/\/\1/')
    fi
    
    for dir in "$UPATH"/AppData/Local/Programs/Python/Python3*; do
        if [ -f "$dir/python.exe" ]; then
            PYTHON_CMD="$dir/python.exe"
            break
        fi
    done
fi

if [ -z "$PYTHON_CMD" ]; then
    for dir in "/c/Program Files/Python3"* "/cygdrive/c/Program Files/Python3"*; do
        if [ -f "$dir/python.exe" ]; then
            PYTHON_CMD="$dir/python.exe"
            break
        fi
    done
fi

if [ -z "$PYTHON_CMD" ]; then
    echo "Python was not found. Please install Python 3.11+."
    exit 1
fi

# Detect npm
NPM_CMD=""
if command -v npm &> /dev/null; then
    NPM_CMD=$(which npm)
fi

if [ -z "$NPM_CMD" ]; then
    for path in "/c/Program Files/nodejs/npm" "/c/Program Files/nodejs/npm.cmd" "/cygdrive/c/Program Files/nodejs/npm"; do
        if [ -f "$path" ]; then
            NPM_CMD="$path"
            break
        fi
    done
fi

if [ -z "$NPM_CMD" ]; then
    echo "npm/Node.js was not found. Please install Node.js."
    exit 1
fi

# 1. Start Docker Postgres
echo "[1/4] Starting PostgreSQL container..."
docker compose up -d postgres
if [ $? -ne 0 ]; then
    echo "Failed to start Postgres container. Please ensure Docker Desktop is running."
    exit 1
fi

# 2. Check Backend Virtual Environment
echo "[2/4] Setting up backend environment..."
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_DIR="$BACKEND_DIR/.venv"

if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment..."
    "$PYTHON_CMD" -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        echo "Failed to create virtual environment."
        exit 1
    fi
fi

echo "Installing/updating backend dependencies..."
if [ -f "$VENV_DIR/Scripts/pip" ]; then
    # Windows Git Bash
    "$VENV_DIR/Scripts/pip" install -e "$BACKEND_DIR[dev]"
else
    # Unix-like Git Bash/WSL
    "$VENV_DIR/bin/pip" install -e "$BACKEND_DIR[dev]"
fi

if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies."
    exit 1
fi

# 3. Check Frontend Dependencies
echo "[3/4] Setting up frontend environment..."
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/frontend"
NODE_MODULES_DIR="$FRONTEND_DIR/node_modules"

if [ ! -d "$NODE_MODULES_DIR" ]; then
    echo "Installing frontend node packages..."
    (cd "$FRONTEND_DIR" && "$NPM_CMD" install)
    if [ $? -ne 0 ]; then
        echo "Failed to install frontend dependencies."
        exit 1
    fi
fi

# 4. Start Services
echo "[4/4] Launching services concurrently..."

# Launch Backend API
if [ -f "$VENV_DIR/Scripts/uvicorn" ]; then
    # Windows Git Bash
    (cd "$BACKEND_DIR" && "$VENV_DIR/Scripts/uvicorn" app.main:app --reload) &
else
    # Unix-like Git Bash/WSL
    (cd "$BACKEND_DIR" && "$VENV_DIR/bin/uvicorn" app.main:app --reload) &
fi
BACKEND_PID=$!

# Launch Frontend Dev
(cd "$FRONTEND_DIR" && "$NPM_CMD" run dev) &
FRONTEND_PID=$!

# Handle shutdown
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

trap cleanup SIGINT SIGTERM

echo "========================================="
echo "Both servers launched successfully!"
echo "  - Backend API: http://127.0.0.1:8000"
echo "  - Frontend Dev: http://localhost:5173"
echo "Press Ctrl+C to stop both servers."
echo "========================================="

wait
