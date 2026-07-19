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
:: 4. Start PostgreSQL container
echo Starting PostgreSQL container...
"%DOCKER_CMD%" compose up -d postgres
if errorlevel 1 (
    echo [ERROR] Failed to start PostgreSQL.
    pause
    exit /b 1
)

:: 5. Launch Backend and Frontend dev servers
echo Starting the backend and frontend servers...
start "PRISM Backend API" /D "%ROOT_DIR%\backend" cmd.exe /k .venv\Scripts\python.exe -m uvicorn app.main:app --reload
start "PRISM Frontend Dev" /D "%ROOT_DIR%\frontend" cmd /k "npm.cmd run dev"

:: 6. Health check wait
timeout /t 4 /nobreak >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(30); do { try { $r=Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/health; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
    echo [ERROR] Backend health check did not respond. Check the server windows for details.
    pause
    exit /b 1
)

echo.
echo =========================================
echo PRISM is running!
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
echo API docs: http://127.0.0.1:8000/docs
echo.
echo Close the two server windows to stop the app.
echo PostgreSQL remains running until you use:
echo   docker compose stop postgres
echo =========================================
exit /b 0
