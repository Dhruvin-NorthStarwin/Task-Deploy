import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator, Field

class Settings(BaseSettings):
    # Database - Railway PostgreSQL database
    DATABASE_URL: str = Field(
        default="postgresql://postgres:hXtqctJOiUofFjeCdncyRVqjrdSNuGNB@trolley.proxy.rlwy.net:38780/railway", 
        env="DATABASE_URL"
    )
    
    # Security - Railway will provide these via environment variables
    SECRET_KEY: str = Field(default="AwSDCoVsJgSEwA3ncBhX24jQgO9gMCdwwLztlVWjXa84G3R2Ui71glJA22cL096y", env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    @field_validator('ACCESS_TOKEN_EXPIRE_MINUTES', mode='before')
    @classmethod
    def parse_token_expire_minutes(cls, v):
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return 60  # Default fallback
        return v or 60
    
    # CORS - Hardcoded production URLs for Railway deployment
    ALLOWED_ORIGINS: Union[str, List[str]] = Field(
        default="https://task-module.up.railway.app,*",
        env="ALLOWED_ORIGINS"
    )
    
    @field_validator('ALLOWED_ORIGINS')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # File Upload
    UPLOAD_DIRECTORY: str = Field(default="./uploads", env=["UPLOAD_DIR", "UPLOAD_DIRECTORY"])
    MAX_FILE_SIZE: int = Field(default=10485760, env="MAX_FILE_SIZE")  # 10MB default
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    ALLOWED_VIDEO_TYPES: List[str] = ["video/mp4", "video/webm", "video/avi", "video/mov"]
    
    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: str = Field(default="dxmdswaly", env="CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: str = Field(default="415182249976459", env="CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: str = Field(default="1Suf70Le9D-y25qsdJUQwQ2BtyQ", env="CLOUDINARY_API_SECRET")
    USE_CLOUD_STORAGE: bool = Field(default=False, env="USE_CLOUD_STORAGE")  # Temporarily disabled for production stability
    
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
    ENVIRONMENT: str = Field(default="production", env="ENVIRONMENT")  # Railway will set this to "production"
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    @field_validator('DEBUG', mode='before')
    @classmethod
    def parse_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on")
        return bool(v) if v is not None else False
    
    # Database Pool (for production with PostgreSQL)
    DB_POOL_SIZE: int = Field(default=5, env="DB_POOL_SIZE")
    DB_MAX_OVERFLOW: int = Field(default=10, env="DB_MAX_OVERFLOW")
    
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
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    
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
        # Handle Railway environment variables
        env_file_encoding = 'utf-8'
        # Allow extra fields to prevent validation errors
        extra = 'ignore'

settings = Settings()

# Validate critical settings in production
if settings.ENVIRONMENT == "production":
    # Allow our production test key
    if settings.SECRET_KEY == "your-secret-key-change-in-production":
        raise ValueError("SECRET_KEY must be changed in production!")
    
    if not settings.DATABASE_URL or settings.DATABASE_URL.startswith("sqlite"):
        print("WARNING: Using SQLite in production is not recommended!")
