#!/bin/bash

# Railway deployment script
echo "🚀 Starting deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Start the server
echo "🌐 Starting server..."
npm start
