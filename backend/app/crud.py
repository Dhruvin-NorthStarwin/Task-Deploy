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
        db_task = models.Task(
            task=task.task,
            description=task.description,
            category=task.category,
            day=task.day,
            task_type=task.task_type,
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
