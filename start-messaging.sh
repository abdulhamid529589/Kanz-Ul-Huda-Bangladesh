#!/bin/bash
# Messaging System - Startup Script
# Run this to start both backend and frontend

echo "🚀 Starting Kanz-Ul-Huda Messaging System"
echo "=========================================="
echo ""

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "📍 Current: $(pwd)"
    echo "📍 Expected: /path/to/Kanz-Ul-Huda-Bangladesh"
    exit 1
fi

echo "✅ Project structure found"
echo ""

# Start backend
echo "🔧 Starting Backend Server..."
echo "   Backend URL: http://localhost:5000"
echo "   API Endpoint: http://localhost:5000/api"
echo ""
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

echo "▶️  Starting backend with: npm run dev"
echo "   Press Ctrl+C to stop"
echo "=========================================="
npm run dev &
BACKEND_PID=$!

sleep 3

# Start frontend in new terminal (if possible)
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo ""
echo "🎨 Starting Frontend Development Server..."
echo "   Frontend URL: http://localhost:5173"
echo "   Dashboard: http://localhost:5173/dashboard"
echo ""
echo "▶️  Starting frontend with: npm run dev"
echo "   Press Ctrl+C to stop"
echo "=========================================="

npm run dev

# Handle script termination
trap "kill $BACKEND_PID" EXIT
