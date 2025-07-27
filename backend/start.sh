#!/bin/bash

# Backend startup script for Railway
echo "🚀 Starting FastAPI backend..."

# Set default port if not provided
export PORT=${PORT:-8000}

# Run database migrations (if needed)
echo "📦 Running database migrations..."
alembic upgrade head || echo "⚠️  No migrations to run or alembic not configured"

# Start the FastAPI server
echo "🌐 Starting server on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
