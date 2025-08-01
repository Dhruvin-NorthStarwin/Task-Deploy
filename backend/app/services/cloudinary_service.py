import cloudinary
import cloudinary.uploader
import cloudinary.api
from cloudinary.utils import cloudinary_url
import base64
import re
from typing import Optional
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

class CloudinaryService:
    """Service for handling Cloudinary uploads"""
    
    @staticmethod
    def is_base64_image(data: str) -> bool:
        """Check if string is a base64 encoded image"""
        if not data:
            return False
        
        # Check for data URL format
        if data.startswith('data:image/'):
            return True
        
        # Check for pure base64 (try to decode)
        try:
            if len(data) > 100:  # Reasonable minimum for image
                base64.b64decode(data)
                return True
        except Exception:
            pass
        
        return False
    
    @staticmethod
    def extract_base64_data(data_url: str) -> tuple[str, str]:
        """Extract base64 data and format from data URL"""
        if data_url.startswith('data:image/'):
            # Extract format and base64 data
            match = re.match(r'data:image/(\w+);base64,(.+)', data_url)
            if match:
                format_type = match.group(1)
                base64_data = match.group(2)
                return base64_data, format_type
        
        # Assume it's pure base64 and default to png
        return data_url, 'png'
    
    @staticmethod
    def upload_base64_image(
        base64_data: str, 
        folder: str = "task_images",
        public_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Upload base64 image to Cloudinary
        Returns the secure URL of uploaded image or None if failed
        """
        try:
            logger.info(f"Attempting to upload image to Cloudinary folder: {folder}")
            
            # Extract base64 data if it's a data URL
            if base64_data.startswith('data:image/'):
                base64_data, format_type = CloudinaryService.extract_base64_data(base64_data)
                logger.info(f"Detected image format: {format_type}")
            
            # Upload to Cloudinary
            upload_options = {
                "folder": folder,
                "resource_type": "image",
                "quality": "auto:good",
                "fetch_format": "auto",
                "crop": "limit",
                "width": 1920,
                "height": 1080
            }
            
            if public_id:
                upload_options["public_id"] = public_id
            
            # Upload using base64 data
            result = cloudinary.uploader.upload(
                f"data:image/png;base64,{base64_data}",
                **upload_options
            )
            
            secure_url = result.get('secure_url')
            logger.info(f"Successfully uploaded image to Cloudinary: {secure_url}")
            logger.info(f"Cloudinary response: {result}")
            
            return secure_url
            
        except Exception as e:
            logger.error(f"Failed to upload image to Cloudinary: {str(e)}")
            logger.error(f"Base64 data length: {len(base64_data) if base64_data else 0}")
            return None
    
    @staticmethod
    def upload_video_base64(
        base64_data: str, 
        folder: str = "task_videos",
        public_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Upload base64 video to Cloudinary
        Returns the secure URL of uploaded video or None if failed
        """
        try:
            logger.info(f"Attempting to upload video to Cloudinary folder: {folder}")
            
            # Extract base64 data if it's a data URL
            if base64_data.startswith('data:video/'):
                match = re.match(r'data:video/(\w+);base64,(.+)', base64_data)
                if match:
                    format_type = match.group(1)
                    base64_data = match.group(2)
                    logger.info(f"Detected video format: {format_type}")
            
            # Upload to Cloudinary
            upload_options = {
                "folder": folder,
                "resource_type": "video",
                "quality": "auto:good"
            }
            
            if public_id:
                upload_options["public_id"] = public_id
            
            # Upload using base64 data
            result = cloudinary.uploader.upload(
                f"data:video/mp4;base64,{base64_data}",
                **upload_options
            )
            
            secure_url = result.get('secure_url')
            logger.info(f"Successfully uploaded video to Cloudinary: {secure_url}")
            
            return secure_url
            
        except Exception as e:
            logger.error(f"Failed to upload video to Cloudinary: {str(e)}")
            return None
    
    @staticmethod
    def get_media_info(url: str) -> dict:
        """Get media information from Cloudinary URL"""
        try:
            # Parse Cloudinary URL to extract details
            # URL format: https://res.cloudinary.com/cloud_name/resource_type/upload/v123456/folder/public_id.ext
            if 'cloudinary.com' not in url:
                return {
                    "is_cloudinary": False,
                    "url": url,
                    "type": "unknown",
                    "message": "Not a Cloudinary URL"
                }
            
            parts = url.split('/')
            if len(parts) < 6:
                return {
                    "is_cloudinary": True,
                    "url": url,
                    "type": "unknown",
                    "message": "Invalid Cloudinary URL format"
                }
            
            resource_type = parts[4]  # 'image' or 'video'
            filename_with_ext = parts[-1]
            filename_parts = filename_with_ext.split('.')
            extension = filename_parts[-1].lower() if len(filename_parts) > 1 else 'unknown'
            
            # Extract public_id for additional operations
            public_id_with_ext = parts[-1]
            public_id = public_id_with_ext.split('.')[0]
            if len(parts) >= 3:
                folder = parts[-2]
                full_public_id = f"{folder}/{public_id}"
            else:
                full_public_id = public_id
            
            media_info = {
                "is_cloudinary": True,
                "url": url,
                "type": resource_type,
                "extension": extension,
                "public_id": full_public_id,
                "filename": filename_with_ext,
                "preview_url": url,
                "thumbnail_url": None,
                "download_url": url
            }
            
            # Generate different sizes for images
            if resource_type == 'image':
                # Generate thumbnail URL (300x300, cropped)
                thumbnail_url = url.replace('/upload/', '/upload/w_300,h_300,c_fill/')
                # Generate medium preview URL (800x600, fit)
                preview_url = url.replace('/upload/', '/upload/w_800,h_600,c_fit/')
                
                media_info.update({
                    "thumbnail_url": thumbnail_url,
                    "preview_url": preview_url,
                    "sizes": {
                        "thumbnail": thumbnail_url,
                        "medium": preview_url,
                        "original": url
                    }
                })
            
            # For videos, generate thumbnail from first frame
            elif resource_type == 'video':
                # Generate video thumbnail (first frame)
                thumbnail_url = url.replace('/video/upload/', '/image/upload/').replace(f'.{extension}', '.jpg')
                if '/upload/' in thumbnail_url:
                    thumbnail_url = thumbnail_url.replace('/upload/', '/upload/w_300,h_300,c_fill/')
                
                media_info.update({
                    "thumbnail_url": thumbnail_url,
                    "video_thumbnail": thumbnail_url,
                    "streaming_url": url
                })
            
            return media_info
            
        except Exception as e:
            logger.error(f"Failed to get media info from URL {url}: {str(e)}")
            return {
                "is_cloudinary": False,
                "url": url,
                "type": "unknown",
                "error": str(e)
            }
    
    @staticmethod
    def generate_preview_urls(url: str, sizes: list = None) -> dict:
        """Generate multiple preview URLs for different sizes"""
        if sizes is None:
            sizes = ['thumbnail', 'small', 'medium', 'large']
        
        try:
            media_info = CloudinaryService.get_media_info(url)
            if not media_info.get('is_cloudinary'):
                return {"error": "Not a Cloudinary URL"}
            
            size_configs = {
                'thumbnail': 'w_150,h_150,c_fill',
                'small': 'w_300,h_300,c_fit',
                'medium': 'w_600,h_600,c_fit', 
                'large': 'w_1200,h_1200,c_fit',
                'original': ''
            }
            
            preview_urls = {}
            for size in sizes:
                if size in size_configs:
                    transform = size_configs[size]
                    if transform:
                        preview_url = url.replace('/upload/', f'/upload/{transform}/')
                    else:
                        preview_url = url
                    preview_urls[size] = preview_url
            
            return {
                "original_url": url,
                "media_type": media_info.get('type'),
                "previews": preview_urls
            }
            
        except Exception as e:
            logger.error(f"Failed to generate preview URLs: {str(e)}")
            return {"error": str(e)}

    @staticmethod
    def delete_by_url(url: str) -> bool:
        """Delete image/video from Cloudinary using URL"""
        try:
            # Extract public_id from URL
            # Cloudinary URLs look like: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/public_id.ext
            parts = url.split('/')
            if len(parts) >= 2:
                # Get the public_id (last part without extension)
                public_id_with_ext = parts[-1]
                public_id = public_id_with_ext.split('.')[0]
                
                # Include folder if present
                if len(parts) >= 3:
                    folder = parts[-2]
                    public_id = f"{folder}/{public_id}"
                
                # Delete from Cloudinary
                result = cloudinary.uploader.destroy(public_id)
                logger.info(f"Deleted from Cloudinary: {public_id}, result: {result}")
                return result.get('result') == 'ok'
            
        except Exception as e:
            logger.error(f"Failed to delete from Cloudinary: {str(e)}")
        
        return False
