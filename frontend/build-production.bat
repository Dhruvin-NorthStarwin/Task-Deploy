@echo off
REM Production Deployment Script for Frontend (Windows)
echo 🚀 Starting production build for RestroManage Frontend...

REM Set production environment
set NODE_ENV=production
set VITE_ENVIRONMENT=production
set VITE_DEBUG=false

REM Install dependencies if not present
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Run production build
echo 🔨 Building application...
npm run build:production

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Production build completed successfully!
    echo 📁 Build output available in ./dist directory
    echo 🌐 Ready for deployment to Railway or other hosting platforms
) else (
    echo ❌ Build failed! Please check the errors above.
    exit /b 1
)

REM Optional: Run preview server
set /p preview="🔍 Would you like to preview the production build? (y/n): "
if /i "%preview%"=="y" (
    echo 🖥️ Starting preview server...
    npm run preview
)
