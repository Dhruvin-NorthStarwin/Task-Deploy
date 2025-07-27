from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas, auth

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=schemas.RegisterResponse)
async def register_restaurant(
    restaurant: schemas.RestaurantCreate,
    db: Session = Depends(get_db)
):
    """Register a new restaurant"""
    # Check if email already exists
    existing_restaurant = db.query(crud.models.Restaurant).filter(
        crud.models.Restaurant.contact_email == restaurant.contact_email
    ).first()
    
    if existing_restaurant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create restaurant
    db_restaurant = crud.create_restaurant(db, restaurant)
    
    return schemas.RegisterResponse(
        restaurant_code=db_restaurant.restaurant_code,
        message="Restaurant registered successfully"
    )

@router.post("/login", response_model=schemas.LoginResponse)
async def login_restaurant(
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """Login restaurant with code and password"""
    restaurant = auth.authenticate_restaurant(
        db, login_data.restaurant_code, login_data.password
    )
    
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid restaurant code or password"
        )
    
    # Create access token
    access_token = auth.create_access_token(data={"sub": str(restaurant.id)})
    
    return schemas.LoginResponse(
        token=access_token,
        restaurant_id=str(restaurant.id),
        restaurant=restaurant
    )

@router.post("/validate-pin", response_model=schemas.PinValidationResponse)
async def validate_pin(
    pin_data: schemas.PinValidationRequest,
    current_restaurant: crud.models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """Validate user PIN for the current restaurant"""
    user = auth.validate_user_pin(db, current_restaurant.id, pin_data.pin)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )
    
    return schemas.PinValidationResponse(
        user=user,
        role=user.role
    )

@router.post("/logout")
async def logout():
    """Logout (token invalidation handled on client side)"""
    return {"message": "Logged out successfully"}
