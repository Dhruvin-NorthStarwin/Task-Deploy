from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from app import models, schemas
from app.auth import get_password_hash, generate_restaurant_code
from datetime import datetime

# Restaurant CRUD
def create_restaurant(db: Session, restaurant: schemas.RestaurantCreate) -> models.Restaurant:
    # Generate unique restaurant code
    restaurant_code = generate_restaurant_code()
    while get_restaurant_by_code(db, restaurant_code):
        restaurant_code = generate_restaurant_code()
    
    # Hash password
    hashed_password = get_password_hash(restaurant.password)
    
    # Create restaurant
    db_restaurant = models.Restaurant(
        restaurant_code=restaurant_code,
        name=restaurant.name,
        cuisine_type=restaurant.cuisine_type,
        contact_email=restaurant.contact_email,
        contact_phone=restaurant.contact_phone,
        password_hash=hashed_password
    )
    
    db.add(db_restaurant)
    db.flush()  # Get the ID without committing
    
    # Create locations
    for location_data in restaurant.locations:
        db_location = models.Location(
            restaurant_id=db_restaurant.id,
            address_line1=location_data.address_line1,
            town_city=location_data.town_city,
            postcode=location_data.postcode
        )
        db.add(db_location)
    
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

def get_restaurant_by_code(db: Session, restaurant_code: str) -> Optional[models.Restaurant]:
    return db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_code == restaurant_code
    ).first()

def get_restaurant_by_id(db: Session, restaurant_id: int) -> Optional[models.Restaurant]:
    return db.query(models.Restaurant).filter(
        models.Restaurant.id == restaurant_id
    ).first()

def get_restaurant_by_name(db: Session, name: str) -> Optional[models.Restaurant]:
    return db.query(models.Restaurant).filter(
        models.Restaurant.name.ilike(f"%{name}%")
    ).first()

def get_restaurant(db: Session, restaurant_id: int) -> Optional[models.Restaurant]:
    """Get restaurant by ID - alias for get_restaurant_by_id"""
    return get_restaurant_by_id(db, restaurant_id)

# User CRUD
def create_user(db: Session, user: schemas.UserCreate, restaurant_id: int) -> models.User:
    db_user = models.User(
        restaurant_id=restaurant_id,
        name=user.name,
        pin=user.pin,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users_by_restaurant(db: Session, restaurant_id: int) -> List[models.User]:
    return db.query(models.User).filter(
        models.User.restaurant_id == restaurant_id,
        models.User.is_active == True
    ).all()

def get_user_by_id(db: Session, user_id: int, restaurant_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(
        models.User.id == user_id,
        models.User.restaurant_id == restaurant_id
    ).first()

def update_user(db: Session, user_id: int, restaurant_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    db_user = get_user_by_id(db, user_id, restaurant_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int, restaurant_id: int) -> bool:
    db_user = get_user_by_id(db, user_id, restaurant_id)
    if not db_user:
        return False
    
    db_user.is_active = False
    db.commit()
    return True

# Task CRUD operations  
def create_task(db: Session, task: schemas.TaskCreate, restaurant_id: int) -> models.Task:
    """Create a new task"""
    print(f"Creating task: {task.dict()}, restaurant_id: {restaurant_id}")
    
    try:
        # Convert string values to enum objects
        def get_enum_from_value(enum_class, value):
            if isinstance(value, str):
                for enum_member in enum_class:
                    if enum_member.value == value:
                        return enum_member
                # If not found by value, try by name
                return enum_class[value.upper()]
            return value
        
        category = get_enum_from_value(models.TaskCategory, task.category)
        day = get_enum_from_value(models.Day, task.day)
        task_type = get_enum_from_value(models.TaskType, task.task_type)
        
        print(f"Converted enums - category: {category}, day: {day}, task_type: {task_type}")
        
        db_task = models.Task(
            task=task.task,
            description=task.description,
            category=category,
            day=day,
            task_type=task_type,
            image_required=task.image_required,
            video_required=task.video_required,
            restaurant_id=restaurant_id,
            status=models.TaskStatus.UNKNOWN,
            initials=task.initials
        )
        
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        print(f"Task created successfully with ID: {db_task.id}")
        return db_task
    except Exception as e:
        db.rollback()
        print(f"Error creating task: {str(e)}")
        raise

def get_tasks_by_restaurant(
    db: Session, 
    restaurant_id: int, 
    filters: Optional[schemas.TaskFilters] = None
) -> List[models.Task]:
    from app.utils import convert_enum_value_to_enum_member
    
    query = db.query(models.Task).filter(models.Task.restaurant_id == restaurant_id)
    
    if filters:
        if filters.status:
            try:
                status_enum = convert_enum_value_to_enum_member(filters.status, models.TaskStatus)
                query = query.filter(models.Task.status == status_enum)
            except Exception as e:
                print(f"Error converting status enum: {e}")
        
        if filters.category:
            try:
                category_enum = convert_enum_value_to_enum_member(filters.category, models.TaskCategory)
                query = query.filter(models.Task.category == category_enum)
            except Exception as e:
                print(f"Error converting category enum: {e}")
        
        if filters.day:
            try:
                day_enum = convert_enum_value_to_enum_member(filters.day, models.Day)
                query = query.filter(models.Task.day == day_enum)
            except Exception as e:
                print(f"Error converting day enum: {e}")
                
        if filters.initials:
            query = query.filter(models.Task.initials == filters.initials)
            
        if filters.task_type:
            try:
                task_type_enum = convert_enum_value_to_enum_member(filters.task_type, models.TaskType)
                query = query.filter(models.Task.task_type == task_type_enum)
            except Exception as e:
                print(f"Error converting task_type enum: {e}")
    
    return query.order_by(models.Task.created_at.desc()).all()

def get_task_by_id(db: Session, task_id: int, restaurant_id: int) -> Optional[models.Task]:
    return db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.restaurant_id == restaurant_id
    ).first()

def update_task(db: Session, task_id: int, restaurant_id: int, task_update: schemas.TaskUpdate) -> Optional[models.Task]:
    from app.utils import convert_enum_value_to_enum_member
    from datetime import datetime
    
    db_task = get_task_by_id(db, task_id, restaurant_id)
    if not db_task:
        return None
    
    update_data = task_update.model_dump(exclude_unset=True)
    
    # Convert enum string values to actual enum members
    try:
        if "status" in update_data:
            status_value = update_data["status"]
            # Handle status change to "Done"
            if status_value == "Done":
                update_data["completed_at"] = datetime.utcnow()
            update_data["status"] = convert_enum_value_to_enum_member(status_value, models.TaskStatus)
            
        if "category" in update_data:
            update_data["category"] = convert_enum_value_to_enum_member(update_data["category"], models.TaskCategory)
            
        if "day" in update_data:
            update_data["day"] = convert_enum_value_to_enum_member(update_data["day"], models.Day)
            
        if "task_type" in update_data:
            update_data["task_type"] = convert_enum_value_to_enum_member(update_data["task_type"], models.TaskType)
    except Exception as e:
        print(f"Error converting enum values during task update: {e}")
        raise
    
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int, restaurant_id: int) -> bool:
    db_task = get_task_by_id(db, task_id, restaurant_id)
    if not db_task:
        return False
    
    db.delete(db_task)
    db.commit()
    return True

# Media file CRUD
def create_media_file(db: Session, media_data: dict) -> models.MediaFile:
    db_media = models.MediaFile(**media_data)
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    return db_media

def get_media_files_by_task(db: Session, task_id: int) -> List[models.MediaFile]:
    return db.query(models.MediaFile).filter(
        models.MediaFile.task_id == task_id
    ).all()

def delete_media_file(db: Session, media_id: int) -> bool:
    db_media = db.query(models.MediaFile).filter(
        models.MediaFile.id == media_id
    ).first()
    
    if not db_media:
        return False
    
    db.delete(db_media)
    db.commit()
    return True

# NFC Cleaning CRUD functions
def get_active_cleaning_task_by_asset(db: Session, asset_id: str, restaurant_id: int) -> Optional[models.Task]:
    """Get the active cleaning task for a specific asset"""
    return db.query(models.Task).filter(
        and_(
            models.Task.restaurant_id == restaurant_id,
            models.Task.task.ilike(f"%{asset_id}%"),  # Asset ID should be in task description
            models.Task.category == models.TaskCategory.CLEANING,
            models.Task.status.in_([models.TaskStatus.UNKNOWN, models.TaskStatus.SUBMITTED])  # Not completed
        )
    ).first()

def get_active_cleaning_task_by_asset_public(db: Session, asset_id: str) -> Optional[models.Task]:
    """Get the active cleaning task for a specific asset (public version for NFC)"""
    return db.query(models.Task).filter(
        and_(
            models.Task.task.ilike(f"%{asset_id}%"),  # Asset ID should be in task description
            models.Task.category == models.TaskCategory.CLEANING,
            models.Task.status.in_([models.TaskStatus.UNKNOWN, models.TaskStatus.SUBMITTED])  # Not completed
        )
    ).first()

def create_cleaning_log(db: Session, log_data: dict) -> models.CleaningLog:
    """Create a new cleaning log entry"""
    db_log = models.CleaningLog(**log_data)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_cleaning_count_by_asset_and_date(db: Session, asset_id: str, restaurant_id: int, start_date: datetime) -> int:
    """Get the count of cleanings for an asset since a specific date"""
    return db.query(models.CleaningLog).filter(
        and_(
            models.CleaningLog.restaurant_id == restaurant_id,
            models.CleaningLog.asset_id == asset_id,
            models.CleaningLog.completed_at >= start_date
        )
    ).count()

def get_recent_cleaning_logs(db: Session, asset_id: str, restaurant_id: int, limit: int = 10) -> List[models.CleaningLog]:
    """Get recent cleaning logs for an asset"""
    return db.query(models.CleaningLog).filter(
        and_(
            models.CleaningLog.restaurant_id == restaurant_id,
            models.CleaningLog.asset_id == asset_id
        )
    ).order_by(models.CleaningLog.completed_at.desc()).limit(limit).all()

def get_cleaning_logs_by_asset_and_date_range(db: Session, asset_id: str, restaurant_id: int, start_date: datetime) -> List[models.CleaningLog]:
    """Get cleaning logs for an asset within a date range"""
    return db.query(models.CleaningLog).filter(
        and_(
            models.CleaningLog.restaurant_id == restaurant_id,
            models.CleaningLog.asset_id == asset_id,
            models.CleaningLog.completed_at >= start_date
        )
    ).order_by(models.CleaningLog.completed_at.desc()).all()

def get_nfc_assets_by_restaurant(db: Session, restaurant_id: int):
    """Get all unique NFC assets (asset IDs) for a restaurant with stats"""
    from sqlalchemy import func
    
    return db.query(
        models.CleaningLog.asset_id.label('asset_id'),
        func.count(models.CleaningLog.id).label('task_count'),
        func.max(models.CleaningLog.completed_at).label('last_cleaned')
    ).filter(
        models.CleaningLog.restaurant_id == restaurant_id
    ).group_by(models.CleaningLog.asset_id).all()
