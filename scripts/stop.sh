#!/bin/bash
# Stop Frontend and Backend Services

echo -e "\033[0;31mStopping JumpJumpJump services...\033[0m"

# Stop Frontend (Node processes on port 3000)
echo -e "\n\033[0;33mStopping Frontend (Vite dev server)...\033[0m"

# Try to kill process on port 3000
if command -v lsof &> /dev/null; then
    VITE_PID=$(lsof -ti:3000)
    if [ ! -z "$VITE_PID" ]; then
        kill -9 $VITE_PID 2>/dev/null
        echo -e "\033[0;32mFrontend process on port 3000 stopped.\033[0m"
    else
        echo -e "\033[0;37mNo Frontend process found running on port 3000.\033[0m"
    fi
elif command -v fuser &> /dev/null; then
    fuser -k 3000/tcp 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "\033[0;32mFrontend process on port 3000 stopped.\033[0m"
    else
        echo -e "\033[0;37mNo Frontend process found running on port 3000.\033[0m"
    fi
fi

# Check for PID file
if [ -f /tmp/jumpjump_frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/jumpjump_frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill -9 $FRONTEND_PID 2>/dev/null
        echo -e "\033[0;32mFrontend process (PID: $FRONTEND_PID) stopped.\033[0m"
    fi
    rm /tmp/jumpjump_frontend.pid
fi

# Stop all node processes related to vite
pkill -f "vite" 2>/dev/null
pkill -f "node.*vite" 2>/dev/null

# Stop Backend (Python/Uvicorn processes on port 8000)
echo -e "\n\033[0;33mStopping Backend (FastAPI server)...\033[0m"

# Try to kill process on port 8000
if command -v lsof &> /dev/null; then
    UVICORN_PID=$(lsof -ti:8000)
    if [ ! -z "$UVICORN_PID" ]; then
        kill -9 $UVICORN_PID 2>/dev/null
        echo -e "\033[0;32mBackend process on port 8000 stopped.\033[0m"
    else
        echo -e "\033[0;37mNo Backend process found running on port 8000.\033[0m"
    fi
elif command -v fuser &> /dev/null; then
    fuser -k 8000/tcp 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "\033[0;32mBackend process on port 8000 stopped.\033[0m"
    else
        echo -e "\033[0;37mNo Backend process found running on port 8000.\033[0m"
    fi
fi

# Check for PID file
if [ -f /tmp/jumpjump_backend.pid ]; then
    BACKEND_PID=$(cat /tmp/jumpjump_backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill -9 $BACKEND_PID 2>/dev/null
        echo -e "\033[0;32mBackend process (PID: $BACKEND_PID) stopped.\033[0m"
    fi
    rm /tmp/jumpjump_backend.pid
fi

# Stop all uvicorn processes
pkill -f "uvicorn" 2>/dev/null

echo -e "\n\033[0;31m==================================\033[0m"
echo -e "\033[0;31mAll Services Stopped!\033[0m"
echo -e "\033[0;31m==================================\033[0m"
