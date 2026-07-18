# 🌈 PRISM — Project Setup Guide

This guide details how to set up and run the PRISM STEM-learning prototype workspace on your local machine.

---

## 📋 Prerequisites

Ensure you have the following installed and running:
* **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/) (must be running for PostgreSQL).
* **Python 3.11+**: [Download here](https://www.python.org/downloads/) (for the FastAPI backend).
* **Node.js (LTS)**: [Download here](https://nodejs.org/) (for the React frontend).

---

## ⚙️ Environment Configuration

PRISM uses a single unified configuration file. Before running the launcher scripts, configure the environment:

1. **Create the `.env` file** at the root of the repository:
   ```bash
   cp .env.example .env
   ```
2. **Configure local values** in that `.env` file (e.g. database credentials and port):
   ```env
   POSTGRES_DB=prism
   POSTGRES_USER=prism
   POSTGRES_PASSWORD=your_local_secret_password
   POSTGRES_PORT=5432
   PRISM_DATABASE_URL=postgresql://prism:your_local_secret_password@127.0.0.1:5432/prism
   ```

> [!NOTE]
> This single root `.env` file is automatically read and shared by Docker Compose, the backend API, and the testing suite.

---

## 🚀 How to Run the Project

We have automated scripts at the root level that handle:
1. Starting the PostgreSQL container inside Docker.
2. Resolving/creating the Python virtual environment (`.venv`) and installing dependencies.
3. Resolving/installing Node packages (`npm install`) if missing.
4. Concurrently running both the API server and frontend interface.

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

| Service | Address |
| :--- | :--- |
| 🌐 **Frontend App** | [http://localhost:5173](http://localhost:5173) |
| ⚙️ **Backend API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| 🏥 **Backend Health Check** | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) |

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
     Remove-Item -Force frontend\package-lock.json
     ```
   * **macOS / Linux**:
     ```bash
     rm -rf frontend/node_modules frontend/package-lock.json
     ```
2. Re-run your corresponding launcher (`run-dev.bat` or `./run-dev.sh`), which will automatically reinstall the packages cleanly.
