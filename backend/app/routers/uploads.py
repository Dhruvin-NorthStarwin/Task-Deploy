from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
from app.database import get_db
from app import crud, schemas, auth, models
from app.services.file_service import file_service

router = APIRouter(prefix="/upload", tags=["uploads"])

@router.get("/health")
async def upload_health():
    """Check upload service health"""
    try:
        from app.services.file_service import file_service
        
        # Test Cloudinary connection if enabled
        cloudinary_status = "disabled"
        if file_service.use_cloud_storage:
            try:
                import cloudinary.api
                cloudinary.api.ping()
                cloudinary_status = "connected"
            except Exception as e:
                cloudinary_status = f"error: {str(e)}"
        
        # Test local storage
        import os
        local_status = "accessible" if os.path.exists(file_service.upload_dir) else "not accessible"
        
        return {
            "status": "healthy",
            "cloudinary": cloudinary_status,
            "local_storage": local_status,
            "upload_directory": file_service.upload_dir,
            "max_file_size": file_service.max_file_size,
            "allowed_image_types": file_service.allowed_image_types,
            "allowed_video_types": file_service.allowed_video_types
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@router.post("/image", response_model=schemas.UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    task_id: str = Form(...),
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Upload an image file for a task"""
    try:
        # Verify task belongs to restaurant
        task = crud.get_task_by_id(db, int(task_id), current_restaurant.id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Save file
        file_data = await file_service.save_image(file, task_id)
        
        # Create media record
        media_data = {
            "task_id": int(task_id),
            **file_data
        }
        db_media = crud.create_media_file(db, media_data)
        
        # Update task with image URL
        if file_data.get("storage_type") == "cloudinary":
            file_url = file_data.get("file_url")
        else:
            # Use production URL if in production environment
            from app.config import settings
            base_url = "https://radiant-amazement-production-d68f.up.railway.app" if settings.ENVIRONMENT == "production" else "http://localhost:8000"
            file_url = file_service.get_file_url(file_data["file_path"], base_url, "local")
        crud.update_task(db, int(task_id), current_restaurant.id, 
                        schemas.TaskUpdate(image_url=file_url))
        
        return schemas.UploadResponse(
            url=file_url,
            filename=file_data["filename"],
            file_size=file_data["file_size"]
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Image upload error: {str(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(e)}"
        )

@router.post("/video", response_model=schemas.UploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    task_id: str = Form(...),
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Upload a video file for a task"""
    try:
        # Verify task belongs to restaurant
        task = crud.get_task_by_id(db, int(task_id), current_restaurant.id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Save file
        file_data = await file_service.save_video(file, task_id)
        
        # Create media record
        media_data = {
            "task_id": int(task_id),
            **file_data
        }
        db_media = crud.create_media_file(db, media_data)
        
        # Update task with video URL
        if file_data.get("storage_type") == "cloudinary":
            file_url = file_data.get("file_url")
        else:
            # Use production URL if in production environment
            from app.config import settings
            base_url = "https://radiant-amazement-production-d68f.up.railway.app" if settings.ENVIRONMENT == "production" else "http://localhost:8000"
            file_url = file_service.get_file_url(file_data["file_path"], base_url, "local")
        crud.update_task(db, int(task_id), current_restaurant.id, 
                        schemas.TaskUpdate(video_url=file_url))
        
        return schemas.UploadResponse(
            url=file_url,
            filename=file_data["filename"],
            file_size=file_data["file_size"]
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Video upload error: {str(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video upload failed: {str(e)}"
        )

@router.get("/serve/{task_id}/{filename}")
async def serve_file(
    task_id: str,
    filename: str,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Serve uploaded files"""
    # Verify task belongs to restaurant
    task = crud.get_task_by_id(db, int(task_id), current_restaurant.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Construct file path
    file_path = os.path.join(
        file_service.upload_dir, 
        "task_completions", 
        task_id, 
        filename
    )
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(file_path)

@router.delete("/media/{media_id}")
async def delete_media(
    media_id: int,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Delete a media file"""
    # Get media file
    media = db.query(models.MediaFile).filter(
        models.MediaFile.id == media_id
    ).first()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media file not found"
        )
    
    # Verify task belongs to restaurant
    task = crud.get_task_by_id(db, media.task_id, current_restaurant.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Delete file from disk
    file_service.delete_file(media.file_path)
    
    # Delete media record
    success = crud.delete_media_file(db, media_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete media record"
        )
    
    return {"message": "Media file deleted successfully"}
