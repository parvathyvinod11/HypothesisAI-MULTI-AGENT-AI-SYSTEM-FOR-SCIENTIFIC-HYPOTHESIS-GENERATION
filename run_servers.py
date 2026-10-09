import subprocess
import sys
import time
import os
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent

def run_servers():
    print("=" * 65)
    print("  Starting AI Scientific Hypothesis Generator System")
    print("=" * 65)

    # 1. Start FastAPI Backend
    print("[1/2] Starting FastAPI Backend on http://localhost:8000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=str(ROOT_DIR),
        shell=True
    )

    # Wait 2 seconds for backend to bind
    time.sleep(2)

    # 2. Start Vite Frontend
    print("[2/2] Starting Vite Frontend on http://localhost:5173 ...")
    frontend_dir = ROOT_DIR / "frontend"
    frontend_proc = subprocess.Popen(
        "npm run dev",
        cwd=str(frontend_dir),
        shell=True
    )

    print("\n" + "=" * 65)
    print("  System is Live!")
    print("  - Frontend: http://localhost:5173")
    print("  - Backend API: http://localhost:8000/docs")
    print("  Press Ctrl+C in this terminal to stop both servers.")
    print("=" * 65 + "\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Done.")

if __name__ == "__main__":
    run_servers()
