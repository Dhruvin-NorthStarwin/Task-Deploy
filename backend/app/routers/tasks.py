from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import crud, schemas, auth, models
from app.services.cloudinary_service import CloudinaryService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/", response_model=List[schemas.Task])
async def get_tasks(
    status: Optional[schemas.TaskStatus] = Query(None),
    category: Optional[schemas.TaskCategory] = Query(None),
    day: Optional[schemas.Day] = Query(None),
    initials: Optional[str] = Query(None),
    task_type: Optional[schemas.TaskType] = Query(None),
    db: Session = Depends(get_db),
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant)
):
    """Get all tasks for the current restaurant with optional filters"""
    from app.utils import convert_enum_for_api
    
    filters = schemas.TaskFilters(
        status=status,
        category=category,
        day=day,
        initials=initials,
        task_type=task_type
    )
    
    # Use authenticated restaurant ID
    restaurant_id = current_restaurant.id
    
    # Get tasks from DB
    tasks = crud.get_tasks_by_restaurant(db, restaurant_id, filters)
    
    # Convert SQLAlchemy objects to dictionaries
    task_dicts = []
    for task in tasks:
        # Convert to dictionary and handle enum values
        task_dict = {c.name: getattr(task, c.name) for c in task.__table__.columns}
        # Convert enum objects to their string values
        task_dicts.append(convert_enum_for_api(task_dict))
    
    return task_dicts

@router.post("/", response_model=schemas.Task)
async def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant)
):
    """Create a new task"""
    from app.utils import convert_enum_for_api
    
    print(f"Create task request received: {task.dict()}")
    print(f"Task category type: {type(task.category)}, value: {task.category}")
    print(f"Task day type: {type(task.day)}, value: {task.day}")
    print(f"Task task_type type: {type(task.task_type)}, value: {task.task_type}")
    
    # Check if we're getting enum objects or strings
    if hasattr(task.category, 'value'):
        print(f"Category enum value: {task.category.value}")
    if hasattr(task.day, 'value'):
        print(f"Day enum value: {task.day.value}")
    if hasattr(task.task_type, 'value'):
        print(f"Task_type enum value: {task.task_type.value}")
    
    # Use authenticated restaurant ID
    restaurant_id = current_restaurant.id
    print(f"Using authenticated restaurant ID: {restaurant_id}")
    
    try:
        # Verify restaurant exists
        restaurant = crud.get_restaurant_by_id(db, restaurant_id)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        
        # Now create the task
        print("Creating task in database")
        db_task = crud.create_task(db, task, restaurant_id)
        
        # Convert SQLAlchemy object to dictionary
        task_dict = {c.name: getattr(db_task, c.name) for c in db_task.__table__.columns}
        # Convert enum objects to their string values
        return convert_enum_for_api(task_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating task: {str(e)}"
        )

@router.get("/{task_id}", response_model=schemas.Task)
async def get_task(
    task_id: int,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Get a specific task by ID"""
    from app.utils import convert_enum_for_api
    
    task = crud.get_task_by_id(db, task_id, current_restaurant.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    # Convert SQLAlchemy object to dictionary
    task_dict = {c.name: getattr(task, c.name) for c in task.__table__.columns}
    # Convert enum objects to their string values
    return convert_enum_for_api(task_dict)

@router.put("/{task_id}", response_model=schemas.Task)
async def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Update a task"""
    from app.utils import convert_enum_for_api
    
    # ...existing code...
    
    try:
        updated_task = crud.update_task(db, task_id, current_restaurant.id, task_update)
        if not updated_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Convert SQLAlchemy object to dictionary
        task_dict = {c.name: getattr(updated_task, c.name) for c in updated_task.__table__.columns}
        # Convert enum objects to their string values
        return convert_enum_for_api(task_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating task: {str(e)}"
        )

@router.patch("/{task_id}/submit", response_model=schemas.Task)
async def submit_task(
    task_id: int,
    submission_data: schemas.TaskSubmit,
    request: Request,
    db: Session = Depends(get_db),
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant_or_none)
):
    """Submit a task with image/video proof"""
    # For development: Use restaurant_id=1 if not authenticated
    restaurant_id = 1
    if current_restaurant:
        restaurant_id = current_restaurant.id
    
    # Process image upload if base64 data is provided
    image_url = submission_data.image_url
    video_url = submission_data.video_url
    
    try:
        # Handle image upload to Cloudinary if base64 data is provided
        if image_url and CloudinaryService.is_base64_image(image_url):
            logger.info(f"Base64 image detected for task {task_id}, uploading to Cloudinary...")
            cloudinary_url = CloudinaryService.upload_base64_image(
                image_url, 
                folder=f"tasks/restaurant_{restaurant_id}",
                public_id=f"task_{task_id}_{submission_data.initials or 'user'}"
            )
            
            if cloudinary_url:
                image_url = cloudinary_url
                logger.info(f"Successfully uploaded image to Cloudinary: {cloudinary_url}")
            else:
                logger.error(f"Failed to upload image to Cloudinary for task {task_id}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to upload image. Please try again."
                )
        else:
            logger.info(f"Image URL already processed for task {task_id}: {image_url}")
        
        # Handle video upload to Cloudinary if base64 data is provided
        if video_url and CloudinaryService.is_base64_image(video_url):
            logger.info(f"Base64 video detected for task {task_id}, uploading to Cloudinary...")
            cloudinary_url = CloudinaryService.upload_video_base64(
                video_url,
                folder=f"tasks/restaurant_{restaurant_id}",
                public_id=f"task_{task_id}_video_{submission_data.initials or 'user'}"
            )
            
            if cloudinary_url:
                video_url = cloudinary_url
                logger.info(f"Successfully uploaded video to Cloudinary: {cloudinary_url}")
            else:
                logger.error(f"Failed to upload video to Cloudinary for task {task_id}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to upload video. Please try again."
                )
        else:
            logger.info(f"Video URL already processed for task {task_id}: {video_url}")
        
        # Update task status to SUBMITTED and add media URLs
        task_update = schemas.TaskUpdate(
            status=schemas.TaskStatus.SUBMITTED,
            image_url=image_url,
            video_url=video_url,
            initials=submission_data.initials
        )
        
        updated_task = crud.update_task(db, task_id, restaurant_id, task_update)
        if not updated_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return updated_task
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error submitting task {task_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting task: {str(e)}"
        )

@router.patch("/{task_id}/approve", response_model=schemas.Task)
async def approve_task(
    task_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant_or_none)
):
    """Approve a submitted task (Admin only)"""
    # For development: Use restaurant_id=1 if not authenticated
    restaurant_id = 1
    if current_restaurant:
        restaurant_id = current_restaurant.id
    
    task_update = schemas.TaskUpdate(status=schemas.TaskStatus.DONE)
    updated_task = crud.update_task(db, task_id, restaurant_id, task_update)
    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return updated_task

@router.patch("/{task_id}/decline", response_model=schemas.Task)
async def decline_task(
    task_id: int,
    decline_data: schemas.TaskDecline,
    request: Request,
    db: Session = Depends(get_db),
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant_or_none)
):
    """Decline a submitted task with reason (Admin only)"""
    # For development: Use restaurant_id=1 if not authenticated
    restaurant_id = 1
    if current_restaurant:
        restaurant_id = current_restaurant.id
    
    task_update = schemas.TaskUpdate(
        status=schemas.TaskStatus.DECLINED,
        decline_reason=decline_data.reason,
        image_url=None,  # Clear the image when declining
        video_url=None   # Clear the video when declining
    )
    updated_task = crud.update_task(db, task_id, restaurant_id, task_update)
    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return updated_task

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant_or_none)
):
    """Delete a task"""
    # For development: Use restaurant_id=1 if not authenticated
    restaurant_id = 1
    if current_restaurant:
        restaurant_id = current_restaurant.id
    
    success = crud.delete_task(db, task_id, restaurant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return {"message": "Task deleted successfully"}

@router.get("/{task_id}/media", response_model=List[schemas.MediaFile])
async def get_task_media(
    task_id: int,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Get all media files for a task"""
    # Verify task belongs to restaurant
    task = crud.get_task_by_id(db, task_id, current_restaurant.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    media_files = crud.get_media_files_by_task(db, task_id)
    return media_files
