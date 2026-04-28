#!/bin/bash
# Task Management UI - Offline Desktop App Launcher (Mac/Linux)

echo ""
echo "================================"
echo "  Task Management UI"
echo "  Offline Mode"
echo "================================"
echo ""
echo "Starting application..."
echo ""

# Navigate to the app directory
cd "$(dirname "$0")"

echo ""
echo "Starting server on http://localhost:3000"
echo ""
echo "The app should open automatically in your default browser."
echo "If it doesn't, visit: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the app"
echo ""

# Use npx serve which doesn't require global installation
sleep 2
npx serve -s build -l 3000
