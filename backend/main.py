from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import create_engine
from app.config import settings
from app.database import engine, Base
from app.routers import auth, tasks, users, uploads, health
from app.middleware.error_handler import global_exception_handler, validation_exception_handler
from app.middleware.cors_middleware import CustomCORSMiddleware
from app.middleware.preflight_middleware import PreflightMiddleware
import uvicorn
import os
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Create FastAPI app
app = FastAPI(
    title="RestroManage Task Module API",
    description="API for restaurant task management system",
    version="1.0.0",
    debug=settings.DEBUG
)

# CORS middleware - use settings for allowed origins
print(f"🔍 CORS Allowed Origins: {settings.ALLOWED_ORIGINS}")
print(f"🔍 Environment: {settings.ENVIRONMENT}")
print(f"🔍 Debug Mode: {settings.DEBUG}")

# Safety check for "*" wildcard - if needed, convert string "*" to ["*"]
origins = settings.ALLOWED_ORIGINS
if origins == ["*"] or origins == "*":
    origins = ["*"]
    print("⚠️ WARNING: Using wildcard CORS origin. This is not recommended for production.")
elif isinstance(origins, str):
    origins = [origins]

# Add frontend Railway domain explicitly for safety
if "https://task-module.up.railway.app" not in origins:
    origins.append("https://task-module.up.railway.app")
    print("✅ Added Railway frontend domain to allowed origins")

# Print final origins list
print(f"🔍 Final CORS Origins: {origins}")

# Add preflight middleware first (handles OPTIONS requests)
app.add_middleware(PreflightMiddleware)

# Configure CORS middleware for all origins
# Note: When using allow_origins=["*"], allow_credentials must be False
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    expose_headers=["*"]
)

# Then add our custom middleware as a backup
app.add_middleware(CustomCORSMiddleware)

# Add global exception handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)

# Create database tables (with error handling)
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
except Exception as e:
    print(f"⚠️  Database connection issue: {e}")
    print("💡 For development, you can use SQLite (no setup required)")
    print("💡 For production, ensure PostgreSQL is running and accessible")

# Static files for serving uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIRECTORY), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(health.router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "RestroManage Task Module API is running",
        "documentation": "/docs",
        "health_check": "/api/health",
        "cors_debug": "/api/cors-debug",
        "environment": settings.ENVIRONMENT,
        "cors_origins": settings.ALLOWED_ORIGINS
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "RestroManage Task Module API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "health": "/api/health"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors"""
    if settings.ENVIRONMENT == "development":
        import traceback
        error_detail = {
            "error": str(exc),
            "traceback": traceback.format_exc()
        }
    else:
        error_detail = {"error": "Internal server error"}
    
    return JSONResponse(
        status_code=500,
        content=error_detail
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False
    )
