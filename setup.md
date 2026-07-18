# PRISM setup guide

This guide starts the PRISM prototype locally from the repository root.

## Prerequisites

Install the following:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) and leave it running.
- [Python 3.11 or newer](https://www.python.org/downloads/).
- [Node.js LTS](https://nodejs.org/), which includes `npm`.

The launcher scripts also require Docker Compose, which is included with current Docker Desktop installations.

## 1. Configure the environment

Run these commands from the repository root:

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS, Linux, WSL, or Git Bash:

```bash
cp .env.example .env
```

Open `.env` and replace `POSTGRES_PASSWORD` with a local password. Keep the same password in `PRISM_DATABASE_URL`:

```env
POSTGRES_DB=prism
POSTGRES_USER=prism
POSTGRES_PASSWORD=your_local_secret_password
POSTGRES_PORT=5432
PRISM_DATABASE_URL=postgresql://prism:your_local_secret_password@127.0.0.1:5432/prism
```

The root `.env` file is used by Docker Compose and the backend. Do not commit it; `.env` is ignored by Git.

## 2. Start the project

The root launchers start PostgreSQL, create the backend virtual environment, install dependencies, and run both development servers.

### Windows

From **Command Prompt** or PowerShell:

```powershell
.\run-dev.bat
```

The script opens separate command windows for the backend and frontend. Close those windows to stop the development servers.

### macOS, Linux, WSL, or Git Bash

```bash
chmod +x run-dev.sh
./run-dev.sh
```

Press `Ctrl+C` to stop both development servers. PostgreSQL continues running in Docker until it is stopped separately.

## 3. Open the services

| Service | Address |
| --- | --- |
| Frontend | [http://localhost:5173](http://localhost:5173) |
| Backend API | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| API health check | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) |
| Interactive API docs | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |

The health check should return:

```json
{"status":"ready"}
```

## Manual setup and verification

Use these commands if you do not want to use a launcher.

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Set up and test the backend:

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

macOS/Linux/WSL/Git Bash:

```bash
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/python -m pytest
.venv/bin/python -m uvicorn app.main:app --reload
```

In a second terminal, install and run the frontend:

```bash
cd frontend
npm install
npm test
npm run build
npm run dev
```

## Stop PostgreSQL

Stop the container and preserve its data:

```bash
docker compose stop postgres
```

To remove the container and its stored database volume, use this only when you intentionally want a fresh database:

```bash
docker compose down -v
```

## Troubleshooting

### Docker or PostgreSQL will not start

Confirm Docker Desktop is running, then check the container:

```bash
docker compose ps
docker compose logs postgres
```

### Password authentication fails

Make sure `POSTGRES_PASSWORD` and the password inside `PRISM_DATABASE_URL` match in the root `.env` file. If the database volume was created with an older password, recreate it:

```bash
docker compose down -v
docker compose up -d postgres
```

This deletes the local PostgreSQL data volume.

### Frontend dependencies are corrupted

Remove only `node_modules` and reinstall. Keep `package-lock.json` when it exists so installs remain reproducible.

PowerShell:

```powershell
Remove-Item -Recurse -Force frontend\node_modules
Push-Location frontend
npm install
Pop-Location
```

macOS/Linux/WSL/Git Bash:

```bash
rm -rf frontend/node_modules
(cd frontend && npm install)
```
