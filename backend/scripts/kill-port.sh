#!/bin/bash
# Script to kill process on port 5001

PORT=5001
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
  echo "No process found on port $PORT"
  exit 0
fi

echo "Killing process $PID on port $PORT"
kill -9 $PID 2>/dev/null

# Wait a moment for the port to be released
sleep 1

# Verify port is free
if lsof -ti:$PORT >/dev/null 2>&1; then
  echo "Warning: Port $PORT is still in use"
  exit 1
else
  echo "Port $PORT is now free"
  exit 0
fi

