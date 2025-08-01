from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import create_engine
from app.config import settings
from app.database import engine, Base
from app.routers import auth, tasks, users, uploads, health, admin_storage, admin_media, nfc
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

# Safety check for production - never use wildcard in production
origins = settings.ALLOWED_ORIGINS
if origins == ["*"] or origins == "*":
    if settings.ENVIRONMENT == "production":
        # Force specific origins for production
        origins = ["https://task-module.up.railway.app", "https://radiant-amazement-production-d68f.up.railway.app"]
        print("🔒 PRODUCTION: Overriding wildcard with specific origins for security")
    else:
        origins = ["*"]
        print("⚠️ WARNING: Using wildcard CORS origin in development.")
elif isinstance(origins, str):
    origins = [origins]

# Ensure production URLs are included
# Hardcoded production origins for Railway deployment
production_origins = [
    # Production Railway URLs - HARDCODED for reliability
    "https://task-module.up.railway.app",
    "https://radiant-amazement-production-d68f.up.railway.app",
    # Local development URLs
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
]

for prod_origin in production_origins:
    if prod_origin not in origins and origins != ["*"]:
        origins.append(prod_origin)
        print(f"✅ Added {prod_origin} to allowed origins")

# Print final origins list
print(f"🔍 Final CORS Origins: {origins}")

# Add preflight middleware first (handles OPTIONS requests)
app.add_middleware(PreflightMiddleware)

# Configure CORS middleware with proper credentials handling
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if origins != ["*"] else False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Then add our custom middleware as a backup
app.add_middleware(CustomCORSMiddleware)

# Exception handlers with CORS support
async def global_exception_handler_with_cors(request: Request, exc: Exception):
    """Global exception handler for unhandled errors with CORS support"""
    if settings.ENVIRONMENT == "development":
        import traceback
        error_detail = {
            "error": str(exc),
            "traceback": traceback.format_exc()
        }
    else:
        error_detail = {"error": "Internal server error"}
    
    # Get origin from request
    origin = request.headers.get("origin", "")
    
    # Create response with CORS headers
    response = JSONResponse(
        status_code=500,
        content=error_detail
    )
    
    # Add CORS headers to error response
    if origin:
        # Check if origin is allowed
        allowed_origins = settings.ALLOWED_ORIGINS
        if (origin in allowed_origins or 
            origin.startswith("http://localhost") or
            origin.startswith("http://127.0.0.1") or
            origin.endswith(".railway.app") or
            allowed_origins == ["*"]):
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
    
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept, Upgrade-Insecure-Requests"
    
    return response

async def http_exception_handler_with_cors(request: Request, exc: HTTPException):
    """HTTP exception handler with CORS support"""
    # Get origin from request
    origin = request.headers.get("origin", "")
    
    # Create response with CORS headers
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    
    # Add CORS headers to error response
    if origin:
        # Check if origin is allowed
        allowed_origins = settings.ALLOWED_ORIGINS
        if (origin in allowed_origins or 
            origin.startswith("http://localhost") or
            origin.startswith("http://127.0.0.1") or
            origin.endswith(".railway.app") or
            allowed_origins == ["*"]):
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
    
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept, Upgrade-Insecure-Requests"
    
    return response

# Add global exception handlers
app.add_exception_handler(Exception, global_exception_handler_with_cors)
app.add_exception_handler(HTTPException, http_exception_handler_with_cors)
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
app.include_router(admin_storage.router, prefix="/api")
app.include_router(admin_media.router, prefix="/api")
app.include_router(nfc.router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "RestroManage Task Module API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "health": "/api/health",
        "cors_debug": "/api/cors-debug",
        "cors_origins": settings.ALLOWED_ORIGINS
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False
    )
