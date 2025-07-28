import os
import uuid
import aiofiles
import asyncio
import base64
import tempfile
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from PIL import Image
from google.cloud import storage
from google.auth.exceptions import DefaultCredentialsError
import io
from app.config import settings

class FileUploadService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIRECTORY
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_image_types = settings.ALLOWED_IMAGE_TYPES
        self.allowed_video_types = settings.ALLOWED_VIDEO_TYPES
        
        # Google Cloud Storage configuration
        self.use_cloud_storage = settings.USE_CLOUD_STORAGE
        self.gcs_bucket_name = settings.GCS_BUCKET_NAME
        self.gcs_client = None
        self.gcs_bucket = None
        
        if self.use_cloud_storage and self.gcs_bucket_name:
            try:
                # Handle Railway base64 encoded credentials
                self._setup_gcs_credentials()
                
                self.gcs_client = storage.Client()
                self.gcs_bucket = self.gcs_client.bucket(self.gcs_bucket_name)
                print(f"✅ Google Cloud Storage initialized - Bucket: {self.gcs_bucket_name}")
            except DefaultCredentialsError:
                print("⚠️ Google Cloud credentials not found, falling back to local storage")
                self.use_cloud_storage = False
            except Exception as e:
                print(f"⚠️ Failed to initialize Google Cloud Storage: {e}")
                self.use_cloud_storage = False
        
        # Create local upload directories as fallback
        if not self.use_cloud_storage:
            os.makedirs(os.path.join(self.upload_dir, "images"), exist_ok=True)
            os.makedirs(os.path.join(self.upload_dir, "videos"), exist_ok=True)
            os.makedirs(os.path.join(self.upload_dir, "task_completions"), exist_ok=True)

    def _setup_gcs_credentials(self):
        """Setup Google Cloud Storage credentials, handling Railway base64 encoding"""
        # Check for base64 encoded credentials (Railway deployment)
        base64_creds = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_BASE64')
        if base64_creds:
            try:
                # Decode base64 credentials
                decoded_creds = base64.b64decode(base64_creds).decode('utf-8')
                
                # Create temporary file for credentials
                temp_creds_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
                temp_creds_file.write(decoded_creds)
                temp_creds_file.close()
                
                # Set environment variable
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_creds_file.name
                print("✅ Decoded base64 GCS credentials for Railway")
                
            except Exception as e:
                print(f"⚠️ Failed to decode base64 credentials: {e}")
                raise
        
        # Otherwise use the regular credentials file path
        elif settings.GOOGLE_APPLICATION_CREDENTIALS:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = settings.GOOGLE_APPLICATION_CREDENTIALS

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
        
        if self.use_cloud_storage:
            return await self._save_to_gcs(content, filename, task_id, file.content_type, "image", file.filename)
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
        
        if self.use_cloud_storage:
            return await self._save_to_gcs(content, filename, task_id, file.content_type, "video", file.filename)
        else:
            return await self._save_to_local(content, filename, task_id, file.content_type, "video", file.filename)

    async def _save_to_gcs(self, content: bytes, filename: str, task_id: str, 
                          content_type: str, file_type: str, original_filename: str) -> dict:
        """Save file to Google Cloud Storage"""
        try:
            # Create blob path: task_completions/task_id/filename
            blob_path = f"task_completions/{task_id}/{filename}"
            blob = self.gcs_bucket.blob(blob_path)
            
            # Set content type
            blob.content_type = content_type
            
            # Upload file in a separate thread to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, blob.upload_from_string, content, content_type)
            
            # Generate public URL
            file_url = f"{settings.GCS_BASE_URL}/{self.gcs_bucket_name}/{blob_path}"
            
            return {
                "filename": filename,
                "original_filename": original_filename,
                "file_path": blob_path,
                "file_url": file_url,
                "file_size": len(content),
                "mime_type": content_type,
                "file_type": file_type,
                "storage_type": "gcs"
            }
        except Exception as e:
            print(f"Failed to upload to GCS: {e}")
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
        """Delete a file from local storage or GCS"""
        try:
            if storage_type == "gcs" and self.use_cloud_storage:
                blob = self.gcs_bucket.blob(file_path)
                blob.delete()
                return True
            else:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    return True
            return False
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False

    def get_file_url(self, file_path: str, base_url: str, storage_type: str = "local") -> str:
        """Generate URL for accessing the file"""
        if storage_type == "gcs":
            return f"{settings.GCS_BASE_URL}/{self.gcs_bucket_name}/{file_path}"
        else:
            # Convert absolute path to relative path for URL
            relative_path = os.path.relpath(file_path, self.upload_dir)
            return f"{base_url}/uploads/{relative_path.replace(os.sep, '/')}"

    async def migrate_to_cloud_storage(self, task_id: Optional[str] = None) -> dict:
        """Migrate existing local files to Google Cloud Storage"""
        if not self.use_cloud_storage:
            return {"error": "Cloud storage not configured"}
        
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

    async def _migrate_directory(self, local_dir: str, gcs_prefix: str, migrated_files: list, failed_files: list):
        """Migrate a directory to GCS"""
        for filename in os.listdir(local_dir):
            file_path = os.path.join(local_dir, filename)
            if os.path.isfile(file_path):
                try:
                    # Read local file
                    async with aiofiles.open(file_path, 'rb') as f:
                        content = await f.read()
                    
                    # Upload to GCS
                    blob_path = f"{gcs_prefix}/{filename}"
                    blob = self.gcs_bucket.blob(blob_path)
                    
                    # Detect content type
                    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                        content_type = f"image/{filename.split('.')[-1].lower()}"
                    elif filename.lower().endswith(('.mp4', '.webm', '.avi', '.mov')):
                        content_type = f"video/{filename.split('.')[-1].lower()}"
                    else:
                        content_type = "application/octet-stream"
                    
                    blob.content_type = content_type
                    
                    # Upload in executor to avoid blocking
                    loop = asyncio.get_event_loop()
                    await loop.run_in_executor(None, blob.upload_from_string, content, content_type)
                    
                    migrated_files.append({
                        "local_path": file_path,
                        "gcs_path": blob_path,
                        "size": len(content)
                    })
                    
                    print(f"✅ Migrated: {file_path} -> gs://{self.gcs_bucket_name}/{blob_path}")
                    
                except Exception as e:
                    failed_files.append({
                        "local_path": file_path,
                        "error": str(e)
                    })
                    print(f"❌ Failed to migrate {file_path}: {e}")

# Create service instance
file_service = FileUploadService()
