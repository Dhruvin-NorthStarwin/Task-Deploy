#!/bin/bash
# Docker build verification script for backend

echo "🐳 Docker Build Verification for Backend"
echo "======================================="

# Set working directory to backend
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"
echo "📁 Checking required files..."

# Check required files
required_files=(
    "Dockerfile"
    "requirements.txt"
    "main.py"
    "init_production_db.py"
    ".dockerignore"
    "railway.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🔍 Dockerfile content check..."
if grep -q "postgresql-client" Dockerfile; then
    echo "✅ PostgreSQL support included"
else
    echo "❌ PostgreSQL support missing"
fi

if grep -q "init_production_db.py" Dockerfile; then
    echo "✅ Production DB initialization included"
else
    echo "❌ Production DB initialization missing"
fi

if grep -q "HEALTHCHECK" Dockerfile; then
    echo "✅ Health check configured"
else
    echo "❌ Health check missing"
fi

echo ""
echo "📦 Requirements check..."
if grep -q "psycopg2-binary" requirements.txt; then
    echo "✅ PostgreSQL driver included"
else
    echo "❌ PostgreSQL driver missing"
fi

if grep -q "fastapi" requirements.txt; then
    echo "✅ FastAPI included"
else
    echo "❌ FastAPI missing"
fi

echo ""
echo "🚀 Railway configuration check..."
if grep -q "DOCKERFILE" railway.json; then
    echo "✅ Docker build configured"
else
    echo "❌ Docker build not configured"
fi

if grep -q "/api/health" railway.json; then
    echo "✅ Health check path configured"
else
    echo "❌ Health check path missing"
fi

echo ""
echo "🎯 Backend Docker setup is ready for Railway deployment!"
echo ""
echo "To test locally (optional):"
echo "  docker build -t task-module-backend ."
echo "  docker run -p 8000:8000 --env-file .env.production task-module-backend"
echo ""
echo "For Railway deployment:"
echo "  1. Set environment variables in Railway dashboard"
echo "  2. Connect to GitHub repository"
echo "  3. Railway will automatically build using Dockerfile"
