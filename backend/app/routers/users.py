from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import crud, schemas, auth, models

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[schemas.User])
async def get_users(
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Get all users for the current restaurant"""
    users = crud.get_users_by_restaurant(db, current_restaurant.id)
    return users

@router.post("/", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Create a new user"""
    # Check if PIN already exists for this restaurant
    existing_user = db.query(models.User).filter(
        models.User.restaurant_id == current_restaurant.id,
        models.User.pin == user.pin,
        models.User.is_active == True
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN already exists for another user"
        )
    
    db_user = crud.create_user(db, user, current_restaurant.id)
    return db_user

@router.get("/{user_id}", response_model=schemas.User)
async def get_user(
    user_id: int,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Get a specific user by ID"""
    user = crud.get_user_by_id(db, user_id, current_restaurant.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Update a user"""
    # Check if PIN already exists for another user
    if user_update.pin:
        existing_user = db.query(models.User).filter(
            models.User.restaurant_id == current_restaurant.id,
            models.User.pin == user_update.pin,
            models.User.id != user_id,
            models.User.is_active == True
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PIN already exists for another user"
            )
    
    updated_user = crud.update_user(db, user_id, current_restaurant.id, user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return updated_user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Delete (deactivate) a user"""
    success = crud.delete_user(db, user_id, current_restaurant.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {"message": "User deleted successfully"}
