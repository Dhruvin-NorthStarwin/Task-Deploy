import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./restro_manage.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    @field_validator('ACCESS_TOKEN_EXPIRE_MINUTES', mode='before')
    @classmethod
    def parse_token_expire_minutes(cls, v):
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return 30  # Default fallback
        return v or 30
    
    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3000,http://localhost:5173,https://task-module.up.railway.app,https://radiant-amazement-production-d68f.up.railway.app"
    )
    
    @field_validator('ALLOWED_ORIGINS')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # File Upload
    UPLOAD_DIRECTORY: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE: int = 10485760  # 10MB default
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    ALLOWED_VIDEO_TYPES: List[str] = ["video/mp4", "video/webm", "video/avi", "video/mov"]
    
    @field_validator('MAX_FILE_SIZE', mode='before')
    @classmethod
    def parse_max_file_size(cls, v):
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return 10485760  # Default 10MB
        return v or 10485760
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = False
    
    @field_validator('DEBUG', mode='before')
    @classmethod
    def parse_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on")
        return bool(v) if v is not None else False
    
    # Database Pool (for production with PostgreSQL)
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    
    @field_validator('DB_POOL_SIZE', mode='before')
    @classmethod
    def parse_pool_size(cls, v):
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return 5
        return v or 5
    
    @field_validator('DB_MAX_OVERFLOW', mode='before')
    @classmethod
    def parse_max_overflow(cls, v):
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return 10
        return v or 10
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    @field_validator('RATE_LIMIT_PER_MINUTE', mode='before')
    @classmethod
    def parse_rate_limit(cls, v):
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return 60
        return v or 60
    
    class Config:
        env_file = ".env"
        # Allow environment variables to override defaults
        case_sensitive = False
        # Use environment variable names exactly as defined
        env_prefix = ""

    def __init__(self, **kwargs):
        # Load environment variables for fields that use os.getenv
        env_values = {}
        
        # Parse environment variables safely
        if "ACCESS_TOKEN_EXPIRE_MINUTES" not in kwargs:
            env_val = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
            if env_val:
                env_values["ACCESS_TOKEN_EXPIRE_MINUTES"] = env_val
                
        if "MAX_FILE_SIZE" not in kwargs:
            env_val = os.getenv("MAX_FILE_SIZE")
            if env_val:
                env_values["MAX_FILE_SIZE"] = env_val
                
        if "DEBUG" not in kwargs:
            env_val = os.getenv("DEBUG")
            if env_val:
                env_values["DEBUG"] = env_val
                
        if "DB_POOL_SIZE" not in kwargs:
            env_val = os.getenv("DB_POOL_SIZE")
            if env_val:
                env_values["DB_POOL_SIZE"] = env_val
                
        if "DB_MAX_OVERFLOW" not in kwargs:
            env_val = os.getenv("DB_MAX_OVERFLOW")
            if env_val:
                env_values["DB_MAX_OVERFLOW"] = env_val
                
        if "RATE_LIMIT_PER_MINUTE" not in kwargs:
            env_val = os.getenv("RATE_LIMIT_PER_MINUTE")
            if env_val:
                env_values["RATE_LIMIT_PER_MINUTE"] = env_val
        
        # Merge with provided kwargs
        kwargs.update(env_values)
        super().__init__(**kwargs)

settings = Settings()

# Validate critical settings in production
if settings.ENVIRONMENT == "production":
    if settings.SECRET_KEY == "your-secret-key-change-in-production":
        raise ValueError("SECRET_KEY must be changed in production!")
    
    if not settings.DATABASE_URL or settings.DATABASE_URL.startswith("sqlite"):
        print("WARNING: Using SQLite in production is not recommended!")
