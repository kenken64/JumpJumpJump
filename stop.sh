#!/bin/bash

# Jump Jump Jump - Stop Script (Mac/Linux)

echo "🛑 Stopping Jump Jump Jump Game..."
echo ""

# Stop backend
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🛑 Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ Backend stopped"
    else
        echo "⚠️  Backend server not running"
    fi
    rm .backend.pid
else
    echo "⚠️  No backend PID file found"
fi

echo ""

# Stop frontend
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🛑 Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✅ Frontend stopped"
    else
        echo "⚠️  Frontend server not running"
    fi
    rm .frontend.pid
else
    echo "⚠️  No frontend PID file found"
fi

echo ""
echo "✨ All servers stopped!"
