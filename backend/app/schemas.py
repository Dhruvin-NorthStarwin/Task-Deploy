from pydantic import BaseModel, EmailStr
from typing import Optional, List, Union
from datetime import datetime
from app.models import TaskStatus, TaskCategory, TaskType, Day  # Import from models

# Location schemas
class LocationBase(BaseModel):
    address_line1: str
    town_city: str
    postcode: str

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    id: int
    restaurant_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    name: str
    pin: str
    role: str = "staff"

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    pin: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    restaurant_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Restaurant schemas
class RestaurantBase(BaseModel):
    name: str
    cuisine_type: str
    contact_email: EmailStr
    contact_phone: str

class RestaurantCreate(RestaurantBase):
    password: str
    locations: List[LocationCreate]

class RestaurantUpdate(RestaurantBase):
    password: Optional[str] = None

class Restaurant(RestaurantBase):
    id: int
    restaurant_code: str
    created_at: datetime
    updated_at: Optional[datetime]
    locations: List[Location] = []
    users: List[User] = []

    class Config:
        from_attributes = True

# Task schemas
class TaskBase(BaseModel):
    task: str
    description: Optional[str] = None
    category: Union[TaskCategory, str]
    day: Union[Day, str]
    task_type: Union[TaskType, str] = "Daily"
    image_required: bool = False
    video_required: bool = False
    initials: Optional[str] = None

    class Config:
        # Use enum values instead of names
        use_enum_values = True

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    task: Optional[str] = None
    description: Optional[str] = None
    category: Optional[Union[TaskCategory, str]] = None
    day: Optional[Union[Day, str]] = None
    status: Optional[Union[TaskStatus, str]] = None
    task_type: Optional[Union[TaskType, str]] = None
    image_required: Optional[bool] = None
    video_required: Optional[bool] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    decline_reason: Optional[str] = None
    initials: Optional[str] = None
    completed_at: Optional[datetime] = None

    class Config:
        # Use enum values instead of names
        use_enum_values = True

class TaskSubmit(BaseModel):
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    initials: Optional[str] = None

class TaskDecline(BaseModel):
    reason: str

class Task(TaskBase):
    id: int
    restaurant_id: int
    status: TaskStatus
    image_url: Optional[str]
    video_url: Optional[str]
    decline_reason: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
        use_enum_values = True

# Media file schemas
class MediaFileBase(BaseModel):
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    file_type: str

class MediaFile(MediaFileBase):
    id: int
    task_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Auth schemas
class LoginRequest(BaseModel):
    restaurant_code: str
    password: str

class LoginResponse(BaseModel):
    token: str
    restaurant_id: str
    restaurant: Restaurant

class RegisterResponse(BaseModel):
    restaurant_code: str
    message: str

class PinValidationRequest(BaseModel):
    pin: str

class PinValidationResponse(BaseModel):
    user: User
    role: str

class TokenData(BaseModel):
    restaurant_id: Optional[str] = None

# Upload schemas
class UploadResponse(BaseModel):
    url: str
    filename: str
    file_size: int

# Error schemas
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

# Filter schemas
class TaskFilters(BaseModel):
    status: Optional[TaskStatus] = None
    category: Optional[TaskCategory] = None
    day: Optional[Day] = None
    initials: Optional[str] = None
    task_type: Optional[TaskType] = None

# NFC schemas
class NFCCleaningRequest(BaseModel):
    staff_name: Optional[str] = None
    notes: Optional[str] = None

class CleaningLogEntry(BaseModel):
    id: int
    asset_id: str
    staff_name: str
    completed_at: datetime
    method: str
    
    class Config:
        from_attributes = True

class NFCCleaningResponse(BaseModel):
    success: bool
    message: str
    asset_id: str
    task_id: int
    completed_at: str
    cleaning_stats: dict
    recent_cleanings: List[dict]

class NFCAssetInfo(BaseModel):
    asset_id: str
    asset_name: str
    nfc_url: str
    qr_url: str
    total_tasks: int
    last_cleaned: Optional[str] = None
