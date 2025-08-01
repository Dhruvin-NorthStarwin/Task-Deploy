from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from typing import Optional, List
from app.auth import get_current_restaurant
from app.services.cloudinary_service import CloudinaryService
from app.schemas import Restaurant
from app.database import get_db
from app import models
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/media", tags=["admin-media"])

@router.get("/preview")
async def get_media_preview(
    url: str = Query(..., description="Media URL to preview"),
    size: str = Query("medium", description="Preview size: thumbnail, small, medium, large, original"),
    current_restaurant: Restaurant = Depends(get_current_restaurant)
):
    """Get media preview information and URLs"""
    try:
        # Get media information
        media_info = CloudinaryService.get_media_info(url)
        
        if not media_info.get('is_cloudinary'):
            # For non-Cloudinary URLs, return basic info
            return {
                "url": url,
                "is_cloudinary": False,
                "preview_url": url,
                "media_type": "unknown",
                "message": "Direct URL - not processed by Cloudinary"
            }
        
        # Generate preview URLs for different sizes
        preview_data = CloudinaryService.generate_preview_urls(url, ['thumbnail', 'small', 'medium', 'large', 'original'])
        
        # Get the requested size or default to medium
        requested_preview = preview_data.get('previews', {}).get(size, url)
        
        return {
            "original_url": url,
            "preview_url": requested_preview,
            "media_type": media_info.get('type'),
            "extension": media_info.get('extension'),
            "filename": media_info.get('filename'),
            "is_cloudinary": True,
            "available_sizes": list(preview_data.get('previews', {}).keys()),
            "all_previews": preview_data.get('previews', {}),
            "thumbnail_url": media_info.get('thumbnail_url'),
            "download_url": url
        }
        
    except Exception as e:
        logger.error(f"Error getting media preview for {url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get media preview: {str(e)}")

@router.get("/redirect")
async def redirect_to_preview(
    url: str = Query(..., description="Media URL to redirect to"),
    size: str = Query("original", description="Size to redirect to"),
    current_restaurant: Restaurant = Depends(get_current_restaurant)
):
    """Redirect to the actual media URL for direct viewing"""
    try:
        if size == "original":
            return RedirectResponse(url=url)
        
        # Generate preview URL for the requested size
        preview_data = CloudinaryService.generate_preview_urls(url, [size])
        preview_url = preview_data.get('previews', {}).get(size, url)
        
        return RedirectResponse(url=preview_url)
        
    except Exception as e:
        logger.error(f"Error redirecting to media {url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to redirect to media: {str(e)}")

@router.get("/tasks/{task_id}/media")
async def get_task_media(
    task_id: int,
    current_restaurant: Restaurant = Depends(get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Get all media associated with a specific task"""
    try:
        # Get the task
        task = db.query(models.Task).filter(
            models.Task.id == task_id,
            models.Task.restaurant_id == current_restaurant.id
        ).first()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        media_items = []
        
        # Process image URL
        if task.image_url:
            image_info = CloudinaryService.get_media_info(task.image_url)
            if image_info.get('is_cloudinary'):
                preview_data = CloudinaryService.generate_preview_urls(task.image_url)
                image_info.update(preview_data)
            
            media_items.append({
                "type": "image",
                "url": task.image_url,
                "field": "image_url",
                **image_info
            })
        
        # Process video URL
        if task.video_url:
            video_info = CloudinaryService.get_media_info(task.video_url)
            if video_info.get('is_cloudinary'):
                preview_data = CloudinaryService.generate_preview_urls(task.video_url)
                video_info.update(preview_data)
            
            media_items.append({
                "type": "video", 
                "url": task.video_url,
                "field": "video_url",
                **video_info
            })
        
        return {
            "task_id": task_id,
            "task_title": task.task,
            "task_status": task.status.value,
            "media_count": len(media_items),
            "media_items": media_items
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task media for task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get task media: {str(e)}")

@router.get("/tasks/with-media")
async def get_tasks_with_media(
    status: Optional[str] = Query(None, description="Filter by task status"),
    media_type: Optional[str] = Query(None, description="Filter by media type: image, video"),
    current_restaurant: Restaurant = Depends(get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Get all tasks that have media attachments"""
    try:
        # Build query
        query = db.query(models.Task).filter(
            models.Task.restaurant_id == current_restaurant.id
        )
        
        # Filter by media type
        if media_type == "image":
            query = query.filter(models.Task.image_url.isnot(None))
        elif media_type == "video":
            query = query.filter(models.Task.video_url.isnot(None))
        else:
            # Tasks with any media
            query = query.filter(
                (models.Task.image_url.isnot(None)) | 
                (models.Task.video_url.isnot(None))
            )
        
        # Filter by status
        if status:
            query = query.filter(models.Task.status == status)
        
        tasks = query.order_by(models.Task.updated_at.desc()).all()
        
        result_tasks = []
        for task in tasks:
            task_data = {
                "id": task.id,
                "title": task.task,
                "description": task.description,
                "status": task.status.value,
                "category": task.category.value,
                "day": task.day.value,
                "initials": task.initials,
                "created_at": task.created_at,
                "updated_at": task.updated_at,
                "media": {
                    "has_image": bool(task.image_url),
                    "has_video": bool(task.video_url),
                    "image_url": task.image_url,
                    "video_url": task.video_url
                }
            }
            
            # Add preview URLs for Cloudinary media
            if task.image_url:
                image_info = CloudinaryService.get_media_info(task.image_url)
                task_data["media"]["image_preview"] = image_info.get('thumbnail_url', task.image_url)
                task_data["media"]["image_type"] = image_info.get('type', 'image')
            
            if task.video_url:
                video_info = CloudinaryService.get_media_info(task.video_url)
                task_data["media"]["video_preview"] = video_info.get('thumbnail_url', task.video_url)
                task_data["media"]["video_type"] = video_info.get('type', 'video')
            
            result_tasks.append(task_data)
        
        return {
            "total_tasks": len(result_tasks),
            "filter_status": status,
            "filter_media_type": media_type,
            "tasks": result_tasks
        }
        
    except Exception as e:
        logger.error(f"Error getting tasks with media: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get tasks with media: {str(e)}")

@router.get("/gallery")
async def get_media_gallery(
    media_type: str = Query("all", description="Media type: all, image, video"),
    page: int = Query(1, description="Page number", ge=1),
    limit: int = Query(20, description="Items per page", ge=1, le=100),
    current_restaurant: Restaurant = Depends(get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Get a gallery view of all media items"""
    try:
        # Build query
        query = db.query(models.Task).filter(
            models.Task.restaurant_id == current_restaurant.id
        )
        
        # Filter by media type
        if media_type == "image":
            query = query.filter(models.Task.image_url.isnot(None))
        elif media_type == "video":
            query = query.filter(models.Task.video_url.isnot(None))
        else:
            # All media
            query = query.filter(
                (models.Task.image_url.isnot(None)) | 
                (models.Task.video_url.isnot(None))
            )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        tasks = query.order_by(models.Task.updated_at.desc()).offset(offset).limit(limit).all()
        
        gallery_items = []
        for task in tasks:
            # Add image if exists
            if task.image_url and (media_type in ["all", "image"]):
                image_info = CloudinaryService.get_media_info(task.image_url)
                gallery_items.append({
                    "id": f"task_{task.id}_image",
                    "task_id": task.id,
                    "task_title": task.task,
                    "media_type": "image",
                    "url": task.image_url,
                    "thumbnail_url": image_info.get('thumbnail_url', task.image_url),
                    "preview_url": image_info.get('preview_url', task.image_url),
                    "created_at": task.updated_at,
                    "initials": task.initials,
                    "status": task.status.value
                })
            
            # Add video if exists
            if task.video_url and (media_type in ["all", "video"]):
                video_info = CloudinaryService.get_media_info(task.video_url)
                gallery_items.append({
                    "id": f"task_{task.id}_video",
                    "task_id": task.id,
                    "task_title": task.task,
                    "media_type": "video",
                    "url": task.video_url,
                    "thumbnail_url": video_info.get('thumbnail_url', task.video_url),
                    "preview_url": task.video_url,
                    "created_at": task.updated_at,
                    "initials": task.initials,
                    "status": task.status.value
                })
        
        total_pages = (total_count + limit - 1) // limit
        
        return {
            "page": page,
            "limit": limit,
            "total_items": len(gallery_items),
            "total_pages": total_pages,
            "total_tasks_with_media": total_count,
            "media_type": media_type,
            "gallery": gallery_items
        }
        
    except Exception as e:
        logger.error(f"Error getting media gallery: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get media gallery: {str(e)}")
