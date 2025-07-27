from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
from app.database import get_db
from app import crud, schemas, auth, models
from app.services.file_service import file_service

router = APIRouter(prefix="/upload", tags=["uploads"])

@router.post("/image", response_model=schemas.UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    task_id: str = Form(...),
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Upload an image file for a task"""
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
    file_url = file_service.get_file_url(file_data["file_path"], "http://localhost:8000")
    crud.update_task(db, int(task_id), current_restaurant.id, 
                    schemas.TaskUpdate(image_url=file_url))
    
    return schemas.UploadResponse(
        url=file_url,
        filename=file_data["filename"],
        file_size=file_data["file_size"]
    )

@router.post("/video", response_model=schemas.UploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    task_id: str = Form(...),
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Upload a video file for a task"""
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
    file_url = file_service.get_file_url(file_data["file_path"], "http://localhost:8000")
    crud.update_task(db, int(task_id), current_restaurant.id, 
                    schemas.TaskUpdate(video_url=file_url))
    
    return schemas.UploadResponse(
        url=file_url,
        filename=file_data["filename"],
        file_size=file_data["file_size"]
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
