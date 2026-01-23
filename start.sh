#!/bin/bash

echo "🚀 Starting HealthLife..."
echo "=========================="
echo ""

# Check if .env files exist
if [ ! -f "frontend/.env" ]; then
    echo "⚠️  frontend/.env not found. Copying from .env.example..."
    cp frontend/.env.example frontend/.env 2>/dev/null || echo "Please create frontend/.env manually"
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Copying from .env.example..."
    cp backend/.env.example backend/.env 2>/dev/null || echo "Please create backend/.env manually"
fi

if [ ! -f "ai-engine/.env" ]; then
    echo "⚠️  ai-engine/.env not found. Copying from .env.example..."
    cp ai-engine/.env.example ai-engine/.env 2>/dev/null || echo "Please create ai-engine/.env manually"
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $FRONTEND_PID $BACKEND_PID $AI_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start Backend
echo "🔧 Starting Backend (port 5000)..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# Start AI Engine
echo "🤖 Starting AI Engine (port 8000)..."
cd ai-engine
source venv/bin/activate
python app.py > ../logs/ai-engine.log 2>&1 &
AI_PID=$!
deactivate
cd ..
sleep 2

# Start Frontend
echo "🎨 Starting Frontend (port 3000)..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Services:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   AI Engine: http://localhost:8000"
echo ""
echo "📋 Logs:"
echo "   Backend:   tail -f logs/backend.log"
echo "   AI Engine: tail -f logs/ai-engine.log"
echo "   Frontend:  tail -f logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all processes
wait

