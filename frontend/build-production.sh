#!/bin/bash

# Production Deployment Script for Frontend
echo "🚀 Starting production build for RestroManage Frontend..."

# Set production environment
export NODE_ENV=production
export VITE_ENVIRONMENT=production
export VITE_DEBUG=false

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run production build
echo "🔨 Building application..."
npm run build:production

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Production build completed successfully!"
    echo "📁 Build output available in ./dist directory"
    echo "🌐 Ready for deployment to Railway or other hosting platforms"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

# Optional: Run preview server
read -p "🔍 Would you like to preview the production build? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🖥️ Starting preview server..."
    npm run preview
fi
