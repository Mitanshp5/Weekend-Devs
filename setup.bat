@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "ROOT_DIR=%CD%"
set "DOCKER_CMD=docker"
set "PYTHON_CMD="
set "NPM_CMD="
set "BACKEND_PYTHON=%ROOT_DIR%\backend\.venv\Scripts\python.exe"

title PRISM Setup
echo =========================================
echo       PRISM Installation & Verification  
echo =========================================
echo.

goto :ensure_env

:success
echo.
echo =========================================
echo PRISM setup complete and verified!
echo.
echo To start the backend and frontend dev servers, run:
echo   run-dev.bat
echo =========================================
exit /b 0

:ensure_env
if not exist ".env" (
    if not exist ".env.example" (
        echo [ERROR] .env.example is missing from the repository root.
        goto :failed
    )
    echo [1/7] Creating the root .env file from .env.example...
    copy /y ".env.example" ".env" >nul
)
for %%K in (POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD POSTGRES_PORT PRISM_DATABASE_URL) do (
    findstr /b /c:"%%K=" ".env" >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] .env is missing %%K. Restore it from .env.example and try again.
        goto :failed
    )
)
goto :ensure_docker

:ensure_docker
echo [2/7] Checking Docker Desktop...
where docker >nul 2>&1
if errorlevel 1 (
    echo Docker was not found. Attempting installation with winget...
    where winget >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker is missing and winget is unavailable.
        echo Install Docker Desktop, then run this file again.
        goto :failed
    )
    winget install --id Docker.DockerDesktop --exact --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo [ERROR] Docker Desktop installation failed or was cancelled.
        goto :failed
    )
    if exist "%ProgramFiles%\Docker\Docker\resources\bin\docker.exe" set "DOCKER_CMD=%ProgramFiles%\Docker\Docker\resources\bin\docker.exe"
)
if not exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" if exist "%LocalAppData%\Docker\Docker Desktop.exe" set "DOCKER_DESKTOP=%LocalAppData%\Docker\Docker Desktop.exe"
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" set "DOCKER_DESKTOP=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if defined DOCKER_DESKTOP start "" "%DOCKER_DESKTOP%" >nul 2>&1

echo Waiting for Docker Desktop to become ready...
for /l %%N in (1,1,90) do (
    "%DOCKER_CMD%" info >nul 2>&1
    if not errorlevel 1 goto :ensure_python
    timeout /t 2 /nobreak >nul
)
echo [ERROR] Docker Desktop did not become ready within 3 minutes.
echo Complete any Docker Desktop first-run or WSL2 prompts, then run this file again.
goto :failed

:ensure_python
echo [3/7] Checking Python 3.11+...
for %%I in (py.exe) do set "PYTHON_CMD=%%~$PATH:I"
if not defined PYTHON_CMD for %%I in (python.exe) do set "PYTHON_CMD=%%~$PATH:I"
if not defined PYTHON_CMD (
    echo Python was not found. Attempting installation with winget...
    where winget >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python is missing and winget is unavailable.
        goto :failed
    )
    winget install --id Python.Python.3.12 --exact --scope user --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo [ERROR] Python installation failed or was cancelled.
        goto :failed
    )
    set "PATH=%LocalAppData%\Programs\Python\Python312;%LocalAppData%\Programs\Python\Python312\Scripts;%PATH%"
    for %%I in (py.exe) do set "PYTHON_CMD=%%~$PATH:I"
    if not defined PYTHON_CMD for %%I in (python.exe) do set "PYTHON_CMD=%%~$PATH:I"
)
if not defined PYTHON_CMD (
    echo [ERROR] Python is still unavailable after installation.
    echo Restart this terminal and run the launcher again.
    goto :failed
)
"%PYTHON_CMD%" -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.11 or newer is required.
    goto :failed
)
goto :ensure_node

:ensure_node
echo [4/7] Checking Node.js and npm...
for %%I in (npm.cmd) do set "NPM_CMD=%%~$PATH:I"
if not defined NPM_CMD if exist "%ProgramFiles%\nodejs\npm.cmd" (
    set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
)
if not defined NPM_CMD (
    echo Node.js was not found. Attempting installation with winget...
    where winget >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Node.js is missing and winget is unavailable.
        goto :failed
    )
    winget install --id OpenJS.NodeJS.LTS --exact --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo [ERROR] Node.js installation failed or was cancelled.
        goto :failed
    )
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
)
if not defined NPM_CMD (
    echo [ERROR] npm is still unavailable after installation.
    echo Restart this terminal and run the launcher again.
    goto :failed
)
call "%NPM_CMD%" --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm could not be started.
    goto :failed
)
goto :start_database

:start_database
echo [5/7] Downloading and starting PostgreSQL...
"%DOCKER_CMD%" compose pull postgres
if errorlevel 1 (
    echo [ERROR] PostgreSQL image download failed. Check Docker and internet access.
    goto :failed
)
"%DOCKER_CMD%" compose up -d --wait postgres
if errorlevel 1 (
    echo [ERROR] PostgreSQL did not become healthy.
    "%DOCKER_CMD%" compose logs --tail=40 postgres
    goto :failed
)
goto :setup_backend

:setup_backend
echo [6/7] Creating the backend virtual environment and installing dependencies...
if not exist "%BACKEND_PYTHON%" (
    "%PYTHON_CMD%" -m venv "%ROOT_DIR%\backend\.venv"
    if errorlevel 1 (
        echo [ERROR] Could not create backend\.venv.
        goto :failed
    )
)
"%BACKEND_PYTHON%" -m pip install --upgrade pip
if errorlevel 1 goto :failed
pushd "%ROOT_DIR%\backend"
"%BACKEND_PYTHON%" -m pip install -e ".[dev]"
set "RESULT=!ERRORLEVEL!"
popd
if not "!RESULT!"=="0" (
    echo [ERROR] Backend dependency installation failed.
    goto :failed
)
goto :setup_frontend

:setup_frontend
echo [7/7] Installing frontend dependencies...
pushd "%ROOT_DIR%\frontend"
if exist package-lock.json (
    call "%NPM_CMD%" ci --no-audit --no-fund
) else (
    call "%NPM_CMD%" install --no-audit --no-fund
)
set "RESULT=!ERRORLEVEL!"
popd
if not "!RESULT!"=="0" (
    echo [ERROR] Frontend dependency installation failed.
    goto :failed
)
goto :verify_project

:verify_project
echo Verifying backend tests and frontend build...
pushd "%ROOT_DIR%\backend"
"%BACKEND_PYTHON%" -m pytest
set "RESULT=!ERRORLEVEL!"
popd
if not "!RESULT!"=="0" (
    echo [ERROR] Backend verification failed.
    goto :failed
)
pushd "%ROOT_DIR%\frontend"
call "%NPM_CMD%" test -- --reporter=dot
if errorlevel 1 (
    popd
    echo [ERROR] Frontend tests failed.
    goto :failed
)
call "%NPM_CMD%" run build
set "RESULT=!ERRORLEVEL!"
popd
if not "!RESULT!"=="0" (
    echo [ERROR] Frontend build failed.
    goto :failed
)
goto :success

:failed
echo.
echo PRISM setup did not finish. Fix the error above and run this file again.
pause
exit /b 1
