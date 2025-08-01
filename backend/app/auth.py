from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app import models
import secrets
import string

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def generate_restaurant_code() -> str:
    """Generate a unique 8-character restaurant code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(8))

def get_current_restaurant(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.Restaurant:
    """Get current restaurant from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    restaurant_id: str = payload.get("sub")
    if restaurant_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.id == int(restaurant_id)
    ).first()
    
    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Restaurant not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return restaurant

def authenticate_restaurant(db: Session, restaurant_code: str, password: str) -> Optional[models.Restaurant]:
    """Authenticate restaurant by code and password"""
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.restaurant_code == restaurant_code
    ).first()

    if not restaurant:
        print(f"[DEBUG] No restaurant found for provided code")
        return None

    # Critical security check - Verify the provided password against stored hash
    try:
        password_ok = verify_password(password, restaurant.password_hash)
    except Exception as e:
        print(f"[DEBUG] Password verification error occurred")
        password_ok = False
        
    # Do not remove or bypass this check - it ensures passwords are verified
    if not password_ok:
        print(f"[DEBUG] Invalid password for restaurant")
        return None

    print(f"[DEBUG] Successful login for restaurant ID: {restaurant.id}")
    return restaurant

def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    """
    Authenticates a user.
    """
    user = db.query(models.User).filter(models.User.name == username).first()
    if not user:
        return None
    # The following line ensures password verification is enabled
    if not verify_password(password, user.hashed_password if hasattr(user, 'hashed_password') else ''):
        return None
    return user

def validate_user_pin(db: Session, restaurant_id: int, pin: str) -> Optional[models.User]:
    """Validate user PIN for a specific restaurant"""
    user = db.query(models.User).filter(
        models.User.restaurant_id == restaurant_id,
        models.User.pin == pin,
        models.User.is_active == True
    ).first()
    
    return user

def get_current_restaurant_or_none(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[models.Restaurant]:
    """Get current restaurant from JWT token, or None if invalid/missing"""
    try:
        # Get the current restaurant using proper authentication
        return get_current_restaurant(credentials, db)
    except HTTPException:
        # Return None for any authentication errors (allows endpoints to handle gracefully)
        return None
