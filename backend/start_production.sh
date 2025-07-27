#!/bin/bash
# Production startup script for Railway backend deployment

echo "🚀 Starting Railway Production Backend..."

# Set production environment
export ENVIRONMENT=production
export DEBUG=false

# Initialize database if needed
echo "📊 Initializing production database..."
python init_production_db.py

# Check if initialization was successful
if [ $? -eq 0 ]; then
    echo "✅ Database initialization complete"
else
    echo "❌ Database initialization failed"
    exit 1
fi

# Start the FastAPI server
echo "🌐 Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
