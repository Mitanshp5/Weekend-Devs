@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "ROOT_DIR=%CD%"
set "DOCKER_CMD=docker"

title PRISM Dev Launcher
echo =========================================
echo       PRISM Dev Environment Launcher    
echo =========================================
echo.

:: 1. Auto-create .env if missing, or load it
if not exist ".env" (
    echo [ERROR] The root .env file is missing. Please run setup.bat first!
    pause
    exit /b 1
)

for %%K in (POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD POSTGRES_PORT PRISM_DATABASE_URL) do (
    findstr /b /c:"%%K=" ".env" >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] .env is missing %%K. Please run setup.bat first!
        pause
        exit /b 1
    )
)

for /f "usebackq delims== tokens=1,2" %%A in (".env") do (
    set "%%A=%%B"
)

:: 2. Check if setup was completed (venv and node_modules exist)
if not exist "backend\.venv" (
    echo [ERROR] backend\.venv is missing. Please run setup.bat first!
    pause
    exit /b 1
)
if not exist "frontend\node_modules" (
    echo [ERROR] frontend\node_modules is missing. Please run setup.bat first!
    pause
    exit /b 1
)
if not exist "flowwatch-sidecar\node_modules" (
    echo [ERROR] flowwatch-sidecar\node_modules is missing. Please run setup.bat first!
    pause
    exit /b 1
)

:: 3. Verify Docker Desktop is running
where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker command was not found. Please ensure Docker Desktop is installed and running.
    pause
    exit /b 1
)

"%DOCKER_CMD%" info >nul 2>&1
if errorlevel 1 (
    echo Docker Desktop is not running. Attempting to start it...
    if not exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" if exist "%LocalAppData%\Docker\Docker Desktop.exe" set "DOCKER_DESKTOP=%LocalAppData%\Docker\Docker Desktop.exe"
    if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" set "DOCKER_DESKTOP=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    if defined DOCKER_DESKTOP start "" "%DOCKER_DESKTOP%" >nul 2>&1
    
    echo Waiting for Docker Desktop to become ready...
    for /l %%N in (1,1,45) do (
        "%DOCKER_CMD%" info >nul 2>&1
        if not errorlevel 1 goto :docker_ready
        timeout /t 2 /nobreak >nul
    )
    echo [ERROR] Docker Desktop did not start in time. Make sure it is running and try again.
    pause
    exit /b 1
)

:docker_ready
:: 4. Start PostgreSQL and Redis containers
echo Starting PostgreSQL and Redis containers...
"%DOCKER_CMD%" compose up -d postgres redis
if errorlevel 1 (
    echo [ERROR] Failed to start PostgreSQL.
    pause
    exit /b 1
)

:: 5. Launch Backend, Frontend, and FlowWatch sidecar dev servers
echo Starting the backend, frontend, and sidecar servers...
start "PRISM Backend API" /D "%ROOT_DIR%\backend" cmd.exe /k .venv\Scripts\python.exe -m uvicorn app.main:app --reload
start "PRISM Frontend Dev" /D "%ROOT_DIR%\frontend" cmd /k "npm.cmd run dev"
start "PRISM FlowWatch Sidecar" /D "%ROOT_DIR%\flowwatch-sidecar" cmd /k "npm.cmd start"

:: 6. Health check wait
timeout /t 4 /nobreak >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(30); do { try { $r=Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/health; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
    echo [ERROR] Backend health check did not respond. Check the server windows for details.
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(30); do { try { $r=Invoke-WebRequest -UseBasicParsing http://127.0.0.1:9400/api/health; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
    echo [ERROR] FlowWatch sidecar did not respond on http://localhost:9400. Check the sidecar window.
    pause
    exit /b 1
)

:: 7. Seed Tutor Analytics data
echo Seeding Tutor Analytics data...
pushd "%ROOT_DIR%\backend"
.venv\Scripts\python.exe -c "from tests.tutor_analytics_fixtures import seed_tutor_analytics_data; seed_tutor_analytics_data()"
popd
if errorlevel 1 (
    echo [WARNING] Failed to seed Tutor Analytics data. Skipping.
)

:: 8. Clear Redis auth rate-limit counters (dev only — prevents 429 on login after restarts)
echo Clearing auth rate-limit counters...
docker exec weekend-devs-redis-1 redis-cli DEL "rate_limit:login:::1" "rate_limit:register:::1" >nul 2>&1

:: 9. Seed demo student learner accounts (idempotent — safe to run on every startup)
echo Seeding demo student accounts...
pushd "%ROOT_DIR%\backend"
.venv\Scripts\python.exe -m app.seed_learners
popd
if errorlevel 1 (
    echo [WARNING] Failed to seed demo student accounts. Skipping.
)

echo.
echo =========================================
echo PRISM is running!
echo Frontend:          http://localhost:5173
echo Backend:           http://127.0.0.1:8000
echo API docs:          http://127.0.0.1:8000/docs
echo FlowWatch Sidecar: http://localhost:9400
echo FlowWatch Ops:     http://localhost:9400/ops
echo.
echo Close the three server windows to stop the app.
echo PostgreSQL remains running until you use:
echo   docker compose stop postgres
echo =========================================
exit /b 0
