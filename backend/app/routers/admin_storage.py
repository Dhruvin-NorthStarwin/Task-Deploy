from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.auth import get_current_restaurant
from app.services.file_service import file_service
from app.schemas import Restaurant

router = APIRouter(prefix="/admin/storage", tags=["admin-storage"])

@router.post("/migrate")
async def migrate_to_cloud_storage(
    task_id: Optional[str] = Query(None, description="Specific task ID to migrate (optional)"),
    current_restaurant: Restaurant = Depends(get_current_restaurant)
):
    """Migrate local files to Google Cloud Storage"""
    # Note: Any authenticated restaurant can use admin storage features
    # You may want to add additional role checks here
    
    if not file_service.use_cloud_storage:
        raise HTTPException(
            status_code=400, 
            detail="Cloud storage not configured. Please set up Google Cloud Storage first."
        )
    
    result = await file_service.migrate_to_cloud_storage(task_id)
    return result

@router.get("/status")
async def get_storage_status(current_restaurant: Restaurant = Depends(get_current_restaurant)):
    """Get current storage configuration status"""
    return {
        "cloud_storage_enabled": file_service.use_cloud_storage,
        "bucket_name": file_service.gcs_bucket_name if file_service.use_cloud_storage else None,
        "storage_type": "Google Cloud Storage" if file_service.use_cloud_storage else "Local Storage",
        "fallback_available": True  # Always have local storage as fallback
    }

@router.post("/test")
async def test_storage_connection(current_restaurant: Restaurant = Depends(get_current_restaurant)):
    """Test storage connection and permissions"""
    try:
        if file_service.use_cloud_storage:
            # Test bucket access
            bucket = file_service.gcs_bucket
            if bucket.exists():
                return {
                    "status": "success",
                    "message": f"Successfully connected to bucket: {file_service.gcs_bucket_name}",
                    "bucket_location": bucket.location,
                    "storage_class": bucket.storage_class
                }
            else:
                return {
                    "status": "warning",
                    "message": f"Bucket {file_service.gcs_bucket_name} does not exist but can be created"
                }
        else:
            return {
                "status": "info",
                "message": "Using local storage - cloud storage not configured"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Storage test failed: {str(e)}"
        }
