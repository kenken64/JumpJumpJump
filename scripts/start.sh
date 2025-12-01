#!/bin/bash
# Start Frontend and Backend Services
# Run this script from the JumpJumpJump root directory

echo -e "\033[0;32mStarting JumpJumpJump services...\033[0m"

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Start Backend
echo -e "\n\033[0;36mStarting Backend (FastAPI)...\033[0m"
BACKEND_PATH="$PROJECT_ROOT/backend"
if [ -d "$BACKEND_PATH" ]; then
    # Check if virtual environment exists
    if [ ! -d "$BACKEND_PATH/venv" ]; then
        echo -e "\033[0;33mCreating Python virtual environment...\033[0m"
        cd "$BACKEND_PATH"
        python3 -m venv venv
    fi
    
    # Start backend in a new terminal
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$BACKEND_PATH'; echo -e '\033[0;33mBackend Server\033[0m'; source venv/bin/activate; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000; exec bash"
    elif command -v xterm &> /dev/null; then
        xterm -e "cd '$BACKEND_PATH'; echo -e '\033[0;33mBackend Server\033[0m'; source venv/bin/activate; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000; bash" &
    else
        # Fallback: run in background
        cd "$BACKEND_PATH"
        source venv/bin/activate
        python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
        echo $! > /tmp/jumpjump_backend.pid
    fi
    echo -e "\033[0;32mBackend started on http://localhost:8000\033[0m"
else
    echo -e "\033[0;33mBackend directory not found. Skipping...\033[0m"
fi

# Wait a moment before starting frontend
sleep 2

# Start Frontend
echo -e "\n\033[0;36mStarting Frontend (React + Vite)...\033[0m"
FRONTEND_PATH="$PROJECT_ROOT/frontend"
if [ -d "$FRONTEND_PATH" ]; then
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        echo -e "\033[0;31mpnpm not found. Installing pnpm...\033[0m"
        npm install -g pnpm
    fi
    
    # Start frontend in a new terminal
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$FRONTEND_PATH'; echo -e '\033[0;33mFrontend Server\033[0m'; echo -e '\033[0;36mInstalling dependencies...\033[0m'; pnpm install; echo -e '\033[0;36mStarting dev server...\033[0m'; pnpm dev; exec bash"
    elif command -v xterm &> /dev/null; then
        xterm -e "cd '$FRONTEND_PATH'; echo -e '\033[0;33mFrontend Server\033[0m'; echo -e '\033[0;36mInstalling dependencies...\033[0m'; pnpm install; echo -e '\033[0;36mStarting dev server...\033[0m'; pnpm dev; bash" &
    else
        # Fallback: run in background
        cd "$FRONTEND_PATH"
        pnpm install > /dev/null 2>&1
        pnpm dev > /dev/null 2>&1 &
        echo $! > /tmp/jumpjump_frontend.pid
    fi
    echo -e "\033[0;32mFrontend started on http://localhost:3000\033[0m"
else
    echo -e "\033[0;31mFrontend directory not found!\033[0m"
fi

echo -e "\n\033[0;32m==================================\033[0m"
echo -e "\033[0;32mServices Started!\033[0m"
echo -e "\033[0;36mFrontend: http://localhost:3000\033[0m"
echo -e "\033[0;36mBackend:  http://localhost:8000\033[0m"
echo -e "\033[0;36mAPI Docs: http://localhost:8000/docs\033[0m"
echo -e "\033[0;32m==================================\033[0m"
