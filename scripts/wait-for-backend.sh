#!/bin/bash

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s http://localhost:3000/api/config > /dev/null 2>&1; then
    echo "✅ Backend is ready!"
    exit 0
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS..."
  sleep 1
done

echo "❌ Backend failed to start within 30 seconds"
exit 1
