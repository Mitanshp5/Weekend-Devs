# PRISM — Project Setup Guide

This guide details how to set up and run the PRISM STEM-learning prototype workspace on your local machine.

---

## 📋 Prerequisites

Ensure you have the following installed and running:
* **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/) (must be running for PostgreSQL).
* **Python 3.11+**: [Download here](https://www.python.org/downloads/) (for the FastAPI backend).
* **Node.js (LTS)**: [Download here](https://nodejs.org/) (for the React frontend).

---

## ⚙️ Environment Configuration

Before running the launchers, verify your environment configurations:
1. **Root `.env`**: Make sure `.env` exists in the repository root folder. You can copy it from `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. **Backend `.env`**: Make sure `.env` also exists in the `backend/` directory, containing the correct database URL referencing your PostgreSQL container:
   ```env
   PRISM_DATABASE_URL=postgresql://prism:<your_password>@127.0.0.1:5432/prism
   ```

---

## 🚀 How to Run the Project

We have automated scripts at the root level that handle:
* Starting the PostgreSQL container inside Docker.
* Resolving and creating the Python virtual environment (`.venv`) and installing dependencies.
* Resolving and installing Node packages (`npm install`) if missing.
* Concurrently running both the API server and frontend interface.

### 💻 On Windows (Command Prompt / CMD)
Simply run the batch launcher from the root directory:
```cmd
run-dev.bat
```
* *This will spin up Postgres and launch the backend API and frontend dev servers in **two separate, clearly labeled command windows** so you can view both logs side-by-side.*

### 🍎 On macOS / Linux / WSL / Git Bash
1. Give execute permissions to the shell script (only needs to be done once):
   ```bash
   chmod +x run-dev.sh
   ```
2. Run the script:
   ```bash
   ./run-dev.sh
   ```
* *This will launch Postgres and run both servers concurrently in your current terminal session. Press **`Ctrl+C`** to cleanly shut down both servers together.*

---

## 🛠️ Accessing the Applications

Once the launchers report success, access the services here:
* 🌐 **Frontend App**: [http://localhost:5173](http://localhost:5173)
* ⚙️ **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* 🏥 **Backend Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## ❓ Troubleshooting

### 1. Database Connection Failures / Password Mismatches
If the backend tests or servers fail to connect to PostgreSQL with a password authentication error:
* Check your `backend/.env` file and make sure the password in `PRISM_DATABASE_URL` matches the `POSTGRES_PASSWORD` defined in the root `.env`.
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
     Remove-Item -Force frontend\package-lock.json
     ```
   * **macOS / Linux**:
     ```bash
     rm -rf frontend/node_modules frontend/package-lock.json
     ```
2. Re-run your corresponding launcher (`run-dev.bat` or `./run-dev.sh`), which will automatically reinstall the packages cleanly.
