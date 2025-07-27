import os
import uuid
import aiofiles
from typing import List
from fastapi import UploadFile, HTTPException, status
from PIL import Image
from app.config import settings

class FileUploadService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIRECTORY
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_image_types = settings.ALLOWED_IMAGE_TYPES
        self.allowed_video_types = settings.ALLOWED_VIDEO_TYPES
        
        # Create upload directories
        os.makedirs(os.path.join(self.upload_dir, "images"), exist_ok=True)
        os.makedirs(os.path.join(self.upload_dir, "videos"), exist_ok=True)
        os.makedirs(os.path.join(self.upload_dir, "task_completions"), exist_ok=True)

    def _validate_file_size(self, file: UploadFile) -> None:
        """Validate file size"""
        if hasattr(file.file, 'seek') and hasattr(file.file, 'tell'):
            file.file.seek(0, 2)  # Seek to end
            file_size = file.file.tell()
            file.file.seek(0)  # Reset to beginning
            
            if file_size > self.max_file_size:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File size {file_size} exceeds maximum allowed size {self.max_file_size}"
                )

    def _validate_image_type(self, file: UploadFile) -> None:
        """Validate image file type"""
        if file.content_type not in self.allowed_image_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file.content_type} not allowed. Allowed types: {self.allowed_image_types}"
            )

    def _validate_video_type(self, file: UploadFile) -> None:
        """Validate video file type"""
        if file.content_type not in self.allowed_video_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file.content_type} not allowed. Allowed types: {self.allowed_video_types}"
            )

    def _generate_filename(self, original_filename: str) -> str:
        """Generate unique filename"""
        file_extension = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        return unique_filename

    async def save_image(self, file: UploadFile, task_id: str) -> dict:
        """Save uploaded image file"""
        self._validate_file_size(file)
        self._validate_image_type(file)
        
        # Generate unique filename
        filename = self._generate_filename(file.filename)
        
        # Create task-specific directory
        task_dir = os.path.join(self.upload_dir, "task_completions", str(task_id))
        os.makedirs(task_dir, exist_ok=True)
        
        file_path = os.path.join(task_dir, filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as buffer:
            content = await file.read()
            await buffer.write(content)
        
        # Get file size
        file_size = len(content)
        
        # Optimize image if it's too large
        try:
            await self._optimize_image(file_path)
        except Exception as e:
            print(f"Image optimization failed: {e}")
        
        return {
            "filename": filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "file_size": file_size,
            "mime_type": file.content_type,
            "file_type": "image"
        }

    async def save_video(self, file: UploadFile, task_id: str) -> dict:
        """Save uploaded video file"""
        self._validate_file_size(file)
        self._validate_video_type(file)
        
        # Generate unique filename
        filename = self._generate_filename(file.filename)
        
        # Create task-specific directory
        task_dir = os.path.join(self.upload_dir, "task_completions", str(task_id))
        os.makedirs(task_dir, exist_ok=True)
        
        file_path = os.path.join(task_dir, filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as buffer:
            content = await file.read()
            await buffer.write(content)
        
        # Get file size
        file_size = len(content)
        
        return {
            "filename": filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "file_size": file_size,
            "mime_type": file.content_type,
            "file_type": "video"
        }

    async def _optimize_image(self, file_path: str) -> None:
        """Optimize image file size while maintaining quality"""
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Resize if too large (max 1920x1080)
                max_width, max_height = 1920, 1080
                if img.width > max_width or img.height > max_height:
                    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                
                # Save with optimization
                img.save(file_path, optimize=True, quality=85)
        except Exception as e:
            print(f"Error optimizing image: {e}")

    def delete_file(self, file_path: str) -> bool:
        """Delete a file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False

    def get_file_url(self, file_path: str, base_url: str) -> str:
        """Generate URL for accessing the file"""
        # Convert absolute path to relative path for URL
        relative_path = os.path.relpath(file_path, self.upload_dir)
        return f"{base_url}/uploads/{relative_path.replace(os.sep, '/')}"

# Create service instance
file_service = FileUploadService()
