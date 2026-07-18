@echo off
title PRISM Dev Launcher
echo =========================================
echo       PRISM Dev Environment Launcher    
echo =========================================

:: Detect Python command (py, python, or python3)
set PYTHON_CMD=

:: Try finding py, python, or python3 in system PATH using absolute paths
for %%I in (py.exe) do set "PYTHON_CMD=%%~$PATH:I"
if not "%PYTHON_CMD%"=="" goto :python_found

for %%I in (python.exe) do set "PYTHON_CMD=%%~$PATH:I"
if not "%PYTHON_CMD%"=="" goto :python_found

for %%I in (python3.exe) do set "PYTHON_CMD=%%~$PATH:I"
if not "%PYTHON_CMD%"=="" goto :python_found

:: If not found in PATH, search standard Windows installation directories
for /d %%D in ("%USERPROFILE%\AppData\Local\Programs\Python\Python3*") do (
    if exist "%%D\python.exe" (
        set "PYTHON_CMD=%%D\python.exe"
        goto :python_found
    )
)
for /d %%D in ("C:\Program Files\Python3*") do (
    if exist "%%D\python.exe" (
        set "PYTHON_CMD=%%D\python.exe"
        goto :python_found
    )
)
for /d %%D in ("C:\Python3*") do (
    if exist "%%D\python.exe" (
        set "PYTHON_CMD=%%D\python.exe"
        goto :python_found
    )
)

:python_found
if "%PYTHON_CMD%"=="" (
    echo Python was not found. Please install Python 3.11+.
    pause
    exit /b 1
)

:: Detect Node/npm
set NPM_CMD=

for %%I in (npm.cmd) do set "NPM_CMD=%%~$PATH:I"
if not "%NPM_CMD%"=="" goto :npm_found

if exist "C:\Program Files\nodejs\npm.cmd" (
    set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
    goto :npm_found
)

if exist "%USERPROFILE%\AppData\Roaming\npm\npm.cmd" (
    set "NPM_CMD=%USERPROFILE%\AppData\Roaming\npm\npm.cmd"
    goto :npm_found
)

:npm_found
if "%NPM_CMD%"=="" (
    echo npm/Node.js was not found. Please install Node.js.
    pause
    exit /b 1
)

:: 1. Start Docker Postgres
echo [1/4] Starting PostgreSQL container...
docker compose up -d postgres
if %ERRORLEVEL% neq 0 (
    echo Failed to start Postgres container. Please ensure Docker Desktop is running.
    pause
    exit /b 1
)

:: 2. Setup Backend
echo [2/4] Setting up backend environment...
if not exist "backend\.venv" (
    echo Creating Python virtual environment...
    "%PYTHON_CMD%" -m venv backend\.venv
    if %ERRORLEVEL% neq 0 (
        echo Failed to create virtual environment.
        pause
        exit /b 1
    )
)

echo Installing/updating backend dependencies...
call backend\.venv\Scripts\pip install -e backend\[dev]
if %ERRORLEVEL% neq 0 (
    echo Failed to install backend dependencies.
    pause
    exit /b 1
)

:: 3. Setup Frontend
echo [3/4] Setting up frontend environment...
if not exist "frontend\node_modules" (
    echo Installing frontend node packages...
    pushd frontend
    call "%NPM_CMD%" install
    popd
    if %ERRORLEVEL% neq 0 (
        echo Failed to install frontend dependencies.
        pause
        exit /b 1
    )
)

:: 4. Start Services in New Windows
echo [4/4] Launching services in separate command windows...

:: Launch Backend
pushd backend
start "PRISM Backend API" cmd /k "call .venv\Scripts\activate && uvicorn app.main:app --reload"
popd

:: Launch Frontend
pushd frontend
start "PRISM Frontend Dev" cmd /k "call "%NPM_CMD%" run dev"
popd

echo =========================================
echo Both servers launched successfully!
echo   - Backend API: http://127.0.0.1:8000
echo   - Frontend Dev: http://localhost:5173
echo =========================================
