from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
import os
import psutil
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Basic health check endpoint"""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        
        # Check if upload directory exists and is writable
        upload_dir_healthy = os.path.exists(settings.UPLOAD_DIRECTORY) and os.access(settings.UPLOAD_DIRECTORY, os.W_OK)
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "environment": settings.ENVIRONMENT,
            "database": "connected",
            "upload_directory": "accessible" if upload_dir_healthy else "inaccessible"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "environment": settings.ENVIRONMENT,
                "database": "disconnected",
                "error": str(e)
            }
        )

@router.get("/readiness")
async def readiness_check():
    """Readiness check for Kubernetes/Docker deployments"""
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT
    }

@router.get("/metrics")
async def get_metrics():
    """Basic metrics endpoint for monitoring"""
    try:
        # Get system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_used_mb": memory.used // (1024 * 1024),
                "memory_total_mb": memory.total // (1024 * 1024),
                "disk_percent": disk.percent,
                "disk_used_gb": disk.used // (1024 * 1024 * 1024),
                "disk_total_gb": disk.total // (1024 * 1024 * 1024)
            },
            "application": {
                "environment": settings.ENVIRONMENT,
                "debug": settings.DEBUG,
                "upload_directory": settings.UPLOAD_DIRECTORY
            }
        }
    except Exception as e:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "error": f"Could not retrieve metrics: {str(e)}"
        }
