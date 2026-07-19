# PRISM setup guide

PRISM is designed to be started by one launcher from the repository root. The launcher installs or prepares the local tools, starts PostgreSQL in Docker, installs backend and frontend dependencies, verifies the project, and then starts both development servers.

## Configuration rule

There is one configuration template and one generated configuration file:

```text
./.env.example  <- tracked template
./.env          <- local file created by the launcher; never commit it
```

Do not create `backend/.env`, `frontend/.env`, or any other environment file. The backend and Docker Compose both read the root `.env` file.

The launcher creates `.env` automatically from `.env.example` on the first run. The template uses safe local-only PostgreSQL credentials, so no manual edit is required for a normal hackathon setup. If you change the password, update both `POSTGRES_PASSWORD` and the password inside `PRISM_DATABASE_URL`.

## Requirements

The launcher can install missing development tools when the operating system supports it, but the computer must have:

- An internet connection.
- Permission to install software and dependencies.
- Docker Desktop on Windows or macOS. On Linux, the launcher can install Docker on Debian/Ubuntu systems with `apt` and `sudo`.

On Windows, the launcher uses `winget` when Docker Desktop, Python, or Node.js is missing. On macOS, it uses Homebrew when those tools are missing. Installation may show a normal operating-system permission or Docker first-run prompt.

## Windows: one-file setup

1. Download or clone the repository.
2. Open the repository folder.
3. Double-click `run-dev.bat`, or run it from PowerShell:

   ```powershell
   .\run-dev.bat
   ```

The script will:

1. Create and validate the root `.env` file.
2. Find Docker Desktop, install it with `winget` if possible, launch it, and wait until the Docker engine is ready.
3. Find Python 3.11+, installing Python 3.12 with `winget` if possible.
4. Find Node.js/npm, installing Node.js LTS with `winget` if possible.
5. Pull the PostgreSQL image and wait for the PostgreSQL container health check to pass.
6. Create `backend/.venv` and install the backend package plus its development dependencies.
7. Install frontend dependencies from `frontend/package-lock.json`.
8. Run backend tests, frontend tests, and the frontend production build.
9. Open separate command windows for the backend and frontend development servers.
10. Check the backend health endpoint before reporting that setup is complete.

If Docker Desktop was just installed, it may ask you to accept its terms or enable WSL2/virtualization. Complete that prompt and run `run-dev.bat` again if the first attempt cannot start the engine.

## macOS, Linux, WSL, or Git Bash: one-file setup

Run the shell launcher from the repository root:

```bash
bash ./run-dev.sh
```

The script performs the same setup, verification, and startup sequence. On macOS it opens Docker Desktop and waits for it to be ready. On Debian/Ubuntu Linux it can install Docker, Python, and Node.js through `apt` when `sudo` is available.

Press `Ctrl+C` to stop both development servers.

## Addresses after startup

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

## Stopping and resetting PostgreSQL

Closing the development server windows or pressing `Ctrl+C` stops the API and frontend. PostgreSQL remains available in Docker for the next run.

Stop PostgreSQL while preserving its data:

```bash
docker compose stop postgres
```

Reset the local database only when you intentionally want to delete its data volume:

```bash
docker compose down -v
```

The next launcher run will download/start PostgreSQL and recreate the database schema.

## What not to do

- Do not create another `.env` file inside `backend` or `frontend`.
- Do not commit `.env`; it contains machine-local configuration.
- Do not delete `frontend/package-lock.json`; the launcher uses it for reproducible installs.
- Do not run `npm install` from the repository root. Frontend commands belong in `frontend`.
- Do not run backend commands from the repository root unless the command explicitly points to `backend/.venv`.
- Do not use `docker compose down -v` unless deleting the local PostgreSQL data is intentional.
- Do not start a second copy of the launcher while the existing backend/frontend windows are running.

## Troubleshooting

### Docker does not become ready

Open Docker Desktop directly and complete any first-run setup, WSL2 installation, virtualization prompt, or terms-of-service prompt. Then run the launcher again. To inspect Docker from a terminal:

```bash
docker info
docker compose ps
docker compose logs --tail=40 postgres
```

If Docker Desktop is not installed and the launcher cannot install it automatically, install Docker Desktop manually and rerun the launcher. The project cannot run PostgreSQL without a working Docker engine.

### Port 5432, 8000, or 5173 is already in use

Stop the application using the port, or change `POSTGRES_PORT` in the root `.env`. The frontend and backend ports are currently defined by their development commands and should normally be left at `5173` and `8000`.

### PostgreSQL password authentication fails

Check that the password in `POSTGRES_PASSWORD` matches the password in `PRISM_DATABASE_URL`. If the credentials were changed after PostgreSQL was first created, reset the local volume and start again:

```bash
docker compose down -v
docker compose up -d --wait postgres
```

This deletes the local PostgreSQL data volume.

### A dependency install fails

Check the internet connection and rerun the same launcher. It is safe to rerun; it reuses the existing virtual environment and reinstalls the declared dependencies. If frontend files are corrupted, close all frontend server windows and remove only `frontend/node_modules`; do not remove `package-lock.json`:

PowerShell:

```powershell
Remove-Item -Recurse -Force frontend\node_modules
.\run-dev.bat
```

macOS/Linux/WSL/Git Bash:

```bash
rm -rf frontend/node_modules
bash ./run-dev.sh
```
