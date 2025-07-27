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

    print(f"[DEBUG] Login attempt: code={restaurant_code}, password={password}")
    if not restaurant:
        print("[DEBUG] No restaurant found for code.")
        return None

    print(f"[DEBUG] Stored hash: {restaurant.password_hash}")
    try:
        password_ok = verify_password(password, restaurant.password_hash)
    except Exception as e:
        print(f"[DEBUG] Password verification error: {e}")
        password_ok = False
    print(f"[DEBUG] Password match: {password_ok}")
    if not password_ok:
        return None

    return restaurant

def validate_user_pin(db: Session, restaurant_id: int, pin: str) -> Optional[models.User]:
    """Validate user PIN for a specific restaurant"""
    user = db.query(models.User).filter(
        models.User.restaurant_id == restaurant_id,
        models.User.pin == pin,
        models.User.is_active == True
    ).first()
    
    return user

def get_current_restaurant_or_none(
    db: Session = Depends(get_db)
) -> Optional[models.Restaurant]:
    """Get current restaurant from JWT token, or None if invalid/missing (for development)"""
    try:
        # For development: Skip authentication and return None
        # This allows the task creation to use default restaurant_id = 1
        return None
    except Exception:
        # Return None for any errors
        return None
