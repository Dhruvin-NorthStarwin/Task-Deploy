#!/bin/bash
# Production startup script for Railway backend deployment with PostgreSQL

echo "🚀 Starting Railway Production Backend with PostgreSQL..."

# Set production environment
export ENVIRONMENT=production
export DEBUG=false

# Ensure DATABASE_URL is set for PostgreSQL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set!"
    echo "Setting default PostgreSQL URL for Railway..."
    export DATABASE_URL="postgresql://postgres:hXtqctJOiUofFjeCdncyRVqjrdSNuGNB@postgres.railway.internal:5432/railway"
fi

echo "📊 Using PostgreSQL database: ${DATABASE_URL:0:30}..."

# Initialize database if needed
echo "📊 Initializing PostgreSQL production database..."
python init_production_db.py

# Check if initialization was successful
if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL database initialization complete"
else
    echo "⚠️ Database initialization had issues, but continuing..."
fi

# Run database migrations
echo "🔄 Running Alembic migrations..."
alembic upgrade head

# Start the FastAPI server
echo "🌐 Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
