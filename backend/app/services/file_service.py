import os
import uuid
import aiofiles
import asyncio
import base64
import tempfile
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from PIL import Image
import cloudinary
import cloudinary.uploader
import cloudinary.api
import io
from app.config import settings

class FileUploadService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIRECTORY
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_image_types = settings.ALLOWED_IMAGE_TYPES
        self.allowed_video_types = settings.ALLOWED_VIDEO_TYPES
        
        # Cloudinary configuration
        self.use_cloud_storage = settings.USE_CLOUD_STORAGE
        self.cloudinary_configured = False
        
        if self.use_cloud_storage:
            try:
                # Configure Cloudinary
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    secure=True
                )
                
                # Test connection
                cloudinary.api.ping()
                self.cloudinary_configured = True
                print(f"✅ Cloudinary initialized - Cloud: {settings.CLOUDINARY_CLOUD_NAME}")
                
            except Exception as e:
                print(f"⚠️ Failed to initialize Cloudinary: {e}")
                self.use_cloud_storage = False
                self.cloudinary_configured = False
        
        # Create local upload directories as fallback
        if not self.use_cloud_storage:
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
        
        # Read file content
        content = await file.read()
        
        # Optimize image
        try:
            content = await self._optimize_image_content(content)
        except Exception as e:
            print(f"Image optimization failed: {e}")
        
        if self.use_cloud_storage and self.cloudinary_configured:
            return await self._save_to_cloudinary(content, filename, task_id, file.content_type, "image", file.filename)
        else:
            return await self._save_to_local(content, filename, task_id, file.content_type, "image", file.filename)

    async def save_video(self, file: UploadFile, task_id: str) -> dict:
        """Save uploaded video file"""
        self._validate_file_size(file)
        self._validate_video_type(file)
        
        # Generate unique filename
        filename = self._generate_filename(file.filename)
        
        # Read file content
        content = await file.read()
        
        if self.use_cloud_storage and self.cloudinary_configured:
            return await self._save_to_cloudinary(content, filename, task_id, file.content_type, "video", file.filename)
        else:
            return await self._save_to_local(content, filename, task_id, file.content_type, "video", file.filename)

    async def _save_to_cloudinary(self, content: bytes, filename: str, task_id: str, 
                                content_type: str, file_type: str, original_filename: str) -> dict:
        """Save file to Cloudinary"""
        try:
            # Create a folder structure: task_completions/task_id/
            folder = f"task_completions/{task_id}"
            
            # Generate public_id without extension
            public_id = f"{folder}/{filename.rsplit('.', 1)[0]}"
            
            # Upload to Cloudinary
            loop = asyncio.get_event_loop()
            
            if file_type == "image":
                # Upload image with optimization
                result = await loop.run_in_executor(
                    None,
                    cloudinary.uploader.upload,
                    content,
                    {
                        "public_id": public_id,
                        "folder": folder,
                        "resource_type": "image",
                        "format": "webp",  # Convert to WebP for better compression
                        "quality": "auto:good",
                        "fetch_format": "auto",
                        "crop": "limit",
                        "width": 1920,
                        "height": 1080
                    }
                )
            else:
                # Upload video
                result = await loop.run_in_executor(
                    None,
                    cloudinary.uploader.upload,
                    content,
                    {
                        "public_id": public_id,
                        "folder": folder,
                        "resource_type": "video",
                        "quality": "auto:good"
                    }
                )
            
            return {
                "filename": filename,
                "original_filename": original_filename,
                "file_path": result["public_id"],
                "file_url": result["secure_url"],
                "file_size": result["bytes"],
                "mime_type": content_type,
                "file_type": file_type,
                "storage_type": "cloudinary",
                "cloudinary_id": result["public_id"]
            }
            
        except Exception as e:
            print(f"Failed to upload to Cloudinary: {e}")
            # Fallback to local storage
            return await self._save_to_local(content, filename, task_id, content_type, file_type, original_filename)

    async def _save_to_local(self, content: bytes, filename: str, task_id: str,
                           content_type: str, file_type: str, original_filename: str) -> dict:
        """Save file to local storage"""
        # Create task-specific directory
        task_dir = os.path.join(self.upload_dir, "task_completions", str(task_id))
        os.makedirs(task_dir, exist_ok=True)
        
        file_path = os.path.join(task_dir, filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as buffer:
            await buffer.write(content)
        
        return {
            "filename": filename,
            "original_filename": original_filename,
            "file_path": file_path,
            "file_size": len(content),
            "mime_type": content_type,
            "file_type": file_type,
            "storage_type": "local"
        }

    async def _optimize_image_content(self, content: bytes) -> bytes:
        """Optimize image content while maintaining quality"""
        try:
            # Load image from bytes
            img = Image.open(io.BytesIO(content))
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Resize if too large (max 1920x1080)
            max_width, max_height = 1920, 1080
            if img.width > max_width or img.height > max_height:
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save optimized image to bytes
            output = io.BytesIO()
            img.save(output, format='JPEG', optimize=True, quality=85)
            return output.getvalue()
        except Exception as e:
            print(f"Error optimizing image: {e}")
            return content  # Return original if optimization fails

    async def _optimize_image(self, file_path: str) -> None:
        """Optimize image file size while maintaining quality (legacy method for local files)"""
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

    def delete_file(self, file_path: str, storage_type: str = "local") -> bool:
        """Delete a file from local storage or Cloudinary"""
        try:
            if storage_type == "cloudinary" and self.use_cloud_storage and self.cloudinary_configured:
                # file_path is the public_id for Cloudinary
                cloudinary.uploader.destroy(file_path)
                return True
            else:
                # Local storage
                if os.path.exists(file_path):
                    os.remove(file_path)
                    return True
            return False
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False

    def get_file_url(self, file_path: str, base_url: str, storage_type: str = "local") -> str:
        """Generate URL for accessing the file"""
        if storage_type == "cloudinary":
            # For Cloudinary, file_path is already the full URL
            return file_path
        else:
            # Convert absolute path to relative path for URL
            relative_path = os.path.relpath(file_path, self.upload_dir)
            return f"{base_url}/uploads/{relative_path.replace(os.sep, '/')}"

    async def migrate_to_cloud_storage(self, task_id: Optional[str] = None) -> dict:
        """Migrate existing local files to Cloudinary"""
        if not self.use_cloud_storage or not self.cloudinary_configured:
            return {"error": "Cloudinary not configured"}
        
        migrated_files = []
        failed_files = []
        
        try:
            base_path = os.path.join(self.upload_dir, "task_completions")
            if task_id:
                # Migrate specific task
                task_path = os.path.join(base_path, str(task_id))
                if os.path.exists(task_path):
                    await self._migrate_directory(task_path, f"task_completions/{task_id}", migrated_files, failed_files)
            else:
                # Migrate all tasks
                if os.path.exists(base_path):
                    for task_dir in os.listdir(base_path):
                        task_path = os.path.join(base_path, task_dir)
                        if os.path.isdir(task_path):
                            await self._migrate_directory(task_path, f"task_completions/{task_dir}", migrated_files, failed_files)
            
            return {
                "migrated_files": len(migrated_files),
                "failed_files": len(failed_files),
                "migrated": migrated_files,
                "failed": failed_files
            }
        except Exception as e:
            return {"error": f"Migration failed: {e}"}

    async def _migrate_directory(self, local_dir: str, cloudinary_folder: str, migrated_files: list, failed_files: list):
        """Migrate a directory to Cloudinary"""
        for filename in os.listdir(local_dir):
            file_path = os.path.join(local_dir, filename)
            if os.path.isfile(file_path):
                try:
                    # Read local file
                    async with aiofiles.open(file_path, 'rb') as f:
                        content = await f.read()
                    
                    # Determine file type and upload to Cloudinary
                    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                        resource_type = "image"
                        public_id = f"{cloudinary_folder}/{filename.rsplit('.', 1)[0]}"
                        
                        loop = asyncio.get_event_loop()
                        result = await loop.run_in_executor(
                            None,
                            cloudinary.uploader.upload,
                            content,
                            {
                                "public_id": public_id,
                                "resource_type": "image",
                                "format": "webp",
                                "quality": "auto:good"
                            }
                        )
                        
                    elif filename.lower().endswith(('.mp4', '.webm', '.avi', '.mov')):
                        resource_type = "video"
                        public_id = f"{cloudinary_folder}/{filename.rsplit('.', 1)[0]}"
                        
                        loop = asyncio.get_event_loop()
                        result = await loop.run_in_executor(
                            None,
                            cloudinary.uploader.upload,
                            content,
                            {
                                "public_id": public_id,
                                "resource_type": "video",
                                "quality": "auto:good"
                            }
                        )
                    else:
                        continue  # Skip unsupported files
                    
                    migrated_files.append({
                        "local_path": file_path,
                        "cloudinary_public_id": result["public_id"],
                        "cloudinary_url": result["secure_url"],
                        "size": result["bytes"]
                    })
                    
                    print(f"✅ Migrated: {file_path} -> {result['secure_url']}")
                    
                except Exception as e:
                    failed_files.append({
                        "local_path": file_path,
                        "error": str(e)
                    })
                    print(f"❌ Failed to migrate {file_path}: {e}")

# Create service instance
file_service = FileUploadService()
