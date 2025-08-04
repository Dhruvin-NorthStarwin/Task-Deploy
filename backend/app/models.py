from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class TaskStatus(enum.Enum):
    UNKNOWN = "Unknown"
    SUBMITTED = "Submitted"
    DONE = "Done"
    DECLINED = "Declined"

class TaskCategory(enum.Enum):
    CLEANING = "Cleaning"
    CUTTING = "Cutting"
    REFILLING = "Refilling"
    OTHER = "Other"

class TaskType(enum.Enum):
    DAILY = "Daily"
    PRIORITY = "Priority"

class Day(enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    restaurant_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    cuisine_type = Column(String(100), nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    locations = relationship("Location", back_populates="restaurant", cascade="all, delete-orphan")
    users = relationship("User", back_populates="restaurant", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="restaurant", cascade="all, delete-orphan")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    address_line1 = Column(String(255), nullable=False)
    town_city = Column(String(100), nullable=False)
    postcode = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="locations")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    pin = Column(String(10), nullable=False)
    role = Column(String(50), nullable=False, default="staff")  # staff, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="users")
    # ...existing code...

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    task = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(TaskCategory, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    day = Column(SQLEnum(Day, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    status = Column(SQLEnum(TaskStatus, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=TaskStatus.UNKNOWN)
    task_type = Column(SQLEnum(TaskType, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=TaskType.DAILY)
    image_required = Column(Boolean, default=False)
    video_required = Column(Boolean, default=False)
    image_url = Column(String(1000), nullable=True)
    video_url = Column(String(1000), nullable=True)
    decline_reason = Column(Text, nullable=True)
    initials = Column(String(10), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # completed_at = Column(DateTime(timezone=True), nullable=True)  # Commented out until migration is created
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="tasks")
    # ...existing code...
    media_files = relationship("MediaFile", back_populates="task", cascade="all, delete-orphan")

class MediaFile(Base):
    __tablename__ = "media_files"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_url = Column(String(1000), nullable=False)  # Cloudinary URL
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_type = Column(String(20), nullable=False)  # image, video
    storage_type = Column(String(50), nullable=False)  # "cloudinary" or "local"
    cloudinary_id = Column(String(255), nullable=True)  # Cloudinary public_id
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="media_files")

class CleaningLog(Base):
    __tablename__ = "cleaning_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(100), nullable=False, index=True)  # e.g., "table-5", "main-freezer"
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)  # Made nullable for self-sufficient NFC
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    
    # Relationships
    task = relationship("Task")
    restaurant = relationship("Restaurant")
