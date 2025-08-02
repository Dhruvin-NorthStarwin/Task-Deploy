from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
import os
import psutil
import sys
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

@router.post("/fix-media-table")
async def fix_media_table(db: Session = Depends(get_db)):
    """Fix MediaFile table by adding missing columns for PostgreSQL"""
    try:
        # SQL commands to add missing columns
        sql_commands = [
            # Add file_url column if it doesn't exist
            """
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name = 'media_files' AND column_name = 'file_url') THEN
                    ALTER TABLE media_files ADD COLUMN file_url VARCHAR(1000);
                END IF;
            END $$;
            """,
            
            # Add storage_type column if it doesn't exist
            """
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name = 'media_files' AND column_name = 'storage_type') THEN
                    ALTER TABLE media_files ADD COLUMN storage_type VARCHAR(50);
                END IF;
            END $$;
            """,
            
            # Add cloudinary_id column if it doesn't exist
            """
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name = 'media_files' AND column_name = 'cloudinary_id') THEN
                    ALTER TABLE media_files ADD COLUMN cloudinary_id VARCHAR(255);
                END IF;
            END $$;
            """,
            
            # Update existing records with default values
            """
            UPDATE media_files 
            SET 
                file_url = COALESCE(file_url, file_path),
                storage_type = COALESCE(storage_type, 'local')
            WHERE file_url IS NULL OR storage_type IS NULL;
            """,
        ]
        
        results = []
        for i, sql in enumerate(sql_commands, 1):
            try:
                db.execute(text(sql))
                results.append(f"Command {i}: Success")
            except Exception as e:
                results.append(f"Command {i}: {str(e)}")
        
        db.commit()
        
        # Verify the changes
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'media_files' 
            ORDER BY ordinal_position;
        """))
        
        columns = [{"name": row.column_name, "type": row.data_type, "nullable": row.is_nullable} for row in result]
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "commands_executed": results,
            "current_schema": columns
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }
        )

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
                "upload_directory": settings.UPLOAD_DIRECTORY,
                "cors_origins": settings.ALLOWED_ORIGINS
            }
        }
    except Exception as e:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "error": f"Could not retrieve metrics: {str(e)}"
        }
        
@router.get("/cors-debug")
async def cors_debug():
    """Debug endpoint to check CORS settings"""
    return {
        "allowed_origins": settings.ALLOWED_ORIGINS,
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "python_version": sys.version,
        "env_variables": {
            "ALLOWED_ORIGINS": os.getenv("ALLOWED_ORIGINS", "Not set"),
            "ENVIRONMENT": os.getenv("ENVIRONMENT", "Not set")
        }
    }
