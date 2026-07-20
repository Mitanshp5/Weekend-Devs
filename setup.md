# PRISM Setup & Development Guide

This guide details how to install, set up, and run the PRISM STEM-learning prototype workspace on your local machine.

We have split the workspace lifecycle into two phases:
1. **One-Time Setup (`setup.bat` / `setup.sh`)**: Installs missing dependencies (Python, Node/npm, Docker Desktop), starts PostgreSQL, sets up virtualenv/packages, and verifies compilation by running tests and production builds.
2. **Daily Development (`run-dev.bat` / `run-dev.sh`)**: Starts the database and launches the dev servers instantly in 2 seconds without running slow tests or builds.

---

## 📋 Prerequisites

Ensure you have the following installed and running:
* **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/) (must be running for PostgreSQL).
* **Python 3.11+**: [Download here](https://www.python.org/downloads/) (for the FastAPI backend).
* **Node.js (LTS)**: [Download here](https://nodejs.org/) (for the React frontend).

The launcher scripts require Docker Compose, which is included by default with Docker Desktop.

---

## 1. Configure the Environment

Run these commands from the repository root:

* **Windows PowerShell**:
  ```powershell
  Copy-Item .env.example .env
  ```
* **macOS / Linux / WSL / Git Bash**:
  ```bash
  cp .env.example .env
  ```

Open the newly created `.env` file and configure local values (specifically setting `POSTGRES_PASSWORD` and keeping the same password in `PRISM_DATABASE_URL`):
```env
POSTGRES_DB=prism
POSTGRES_USER=prism
POSTGRES_PASSWORD=your_local_secret_password
POSTGRES_PORT=5432
PRISM_DATABASE_URL=postgresql://prism:your_local_secret_password@127.0.0.1:5432/prism
```

> [!NOTE]
> This single root `.env` file is automatically read and shared by Docker Compose, the backend API, and the testing suite. Do not commit `.env` to Git.

---

## 2. One-Time Setup & Verification

Before running the development servers for the first time, run the setup script from the root folder to install everything and run initial health checks.

* **Windows (Command Prompt / CMD / PowerShell)**:
  ```cmd
  setup.bat
  ```
  *(Uses `winget` to automatically install missing tools like Python or Node if they are not in your path.)*

* **macOS / Linux / WSL / Git Bash**:
  ```bash
  chmod +x setup.sh
  ./setup.sh
  ```
  *(Uses Homebrew on macOS or `apt` on Debian/Ubuntu systems to install missing dependencies.)*

---

## 3. Launch the Development Servers

Once setup completes successfully, start your dev servers instantly:

* **Windows (Command Prompt / CMD / PowerShell)**:
  ```cmd
  run-dev.bat
  ```
  *(Launches uvicorn and npm in **two separate, clearly labeled command windows** so you can view both logs side-by-side.)*

* **macOS / Linux / WSL / Git Bash**:
  ```bash
  chmod +x run-dev.sh
  ./run-dev.sh
  ```
  *(Runs both servers concurrently in your current terminal session. Press **`Ctrl+C`** to stop them.)*

---

## 🛠️ Accessing the Applications

Once the launchers report success, access the services here:

| Service | Address |
| :--- | :--- |
| 🌐 **Frontend App** | [http://localhost:5173](http://localhost:5173) |
| ⚙️ **Backend API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| 🏥 **Backend Health Check** | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) |
| 📘 **Interactive API Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |
| ⚡ **FlowWatch Sidecar API** | [http://localhost:9400](http://localhost:9400) |
| 📊 **FlowWatch Ops Dashboard** | [http://localhost:9400/ops](http://localhost:9400/ops) |

### 🔑 Demo Student Credentials
Pre-seeded student accounts for testing are listed in [users.md](file:///c:/Users/Pranshul%20Soni/Documents/Projects/Hackathons/Weekend-Devs/users.md) (e.g. `aanya@prism.demo` / `Prism_demo_1`). Each account is automatically seeded into PostgreSQL when you run `run-dev.bat` or `./run-dev.sh`.

---

## ❓ Troubleshooting

### 1. Database Connection Failures / Password Mismatches
If the backend tests or servers fail to connect to PostgreSQL with a password authentication error:
* Check the `.env` file in the project root and make sure the password in `PRISM_DATABASE_URL` matches the `POSTGRES_PASSWORD` defined in the same file.
* If you changed the password, restart your Docker container so it uses the updated credentials:
  ```bash
  docker compose down -v
  docker compose up -d postgres
  ```

### 2. npm Errors / Corrupted `node_modules`
If you see errors such as `Cannot find module .../npm-prefix.js` or `npm-cli.js`:
1. Clean up and delete any corrupted dependency files:
   * **Windows (PowerShell)**:
     ```powershell
     Remove-Item -Recurse -Force frontend\node_modules
     ```
   * **macOS / Linux**:
     ```bash
     rm -rf frontend/node_modules
     ```
2. Re-run your corresponding launcher setup (`setup.bat` or `./setup.sh`), which will automatically reinstall the packages cleanly.
