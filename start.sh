#!/bin/bash

# Jump Jump Jump - Start Script (Mac/Linux)

echo "🎮 Starting Jump Jump Jump Game..."
echo ""

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "📦 Setting up backend virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✅ Backend setup complete!"
    echo ""
fi

# Start backend server
echo "🚀 Starting backend server..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..
echo "✅ Backend running on http://localhost:8000 (PID: $BACKEND_PID)"
echo ""

# Wait for backend to start
sleep 2

# Start frontend
echo "🚀 Starting frontend..."
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""

# Save PIDs to file for stop script
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo "✨ Game is ready!"
echo ""
echo "📝 Backend API: http://localhost:8000"
echo "🎮 Game URL: http://localhost:5173"
echo "📊 Leaderboard: http://localhost:8000/api/scores/leaderboard"
echo ""
echo "To stop the servers, run: ./stop.sh"
echo ""

# Keep script running
wait
