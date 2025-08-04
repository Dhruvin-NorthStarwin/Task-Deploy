from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any
import logging

from app.database import get_db
from app import crud, schemas, models, auth

router = APIRouter(prefix="/nfc", tags=["nfc"])
logger = logging.getLogger(__name__)

@router.post("/clean/{restaurant_code}/{asset_id}")
async def complete_cleaning_task(
    restaurant_code: str,
    asset_id: str,
    staff_info: schemas.NFCCleaningRequest,
    db: Session = Depends(get_db)
):
    """
    Complete a cleaning task via NFC tap (self-sufficient endpoint)
    Creates cleaning log entry directly without requiring existing tasks
    """
    try:
        # Find restaurant by ID, restaurant_code, or name
        restaurant = None
        try:
            # Try as restaurant ID first
            restaurant_id = int(restaurant_code)
            restaurant = crud.get_restaurant(db, restaurant_id)
        except ValueError:
            # If not a number, try to find by restaurant_code first
            restaurant = crud.get_restaurant_by_code(db, restaurant_code)
            
            # If still not found, try to find by name
            if not restaurant:
                restaurant = crud.get_restaurant_by_name(db, restaurant_code)
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurant '{restaurant_code}' not found"
            )
        
        # Validate staff name
        if not staff_info.staff_name or len(staff_info.staff_name.strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Staff name is required and must be at least 2 characters"
            )
        
        # Validate asset ID
        if not asset_id or len(asset_id.strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset ID is required and must be at least 2 characters"
            )
        
        current_time = datetime.now()
        
        # Create cleaning log entry directly (self-sufficient)
        cleaning_log_data = {
            "asset_id": asset_id.strip(),
            "task_id": None,  # No task ID needed for self-sufficient NFC
            "restaurant_id": restaurant.id,
            "staff_name": staff_info.staff_name.strip(),
            "completed_at": current_time,
            "method": "NFC",
            "notes": staff_info.notes
        }
        
        cleaning_log = crud.create_cleaning_log(db, cleaning_log_data)
        
        # Get cleaning statistics for today
        today_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = crud.get_cleaning_count_by_asset_and_date(
            db, asset_id, restaurant.id, today_start
        )
        
        # Get last 10 cleaning entries for this asset
        recent_cleanings = crud.get_recent_cleaning_logs(
            db, asset_id, restaurant.id, limit=10
        )
        
        return {
            "success": True,
            "message": f"{asset_id.replace('-', ' ').title()} marked as cleaned!",
            "asset_id": asset_id,
            "restaurant_id": restaurant.id,
            "restaurant_name": restaurant.name,
            "log_id": cleaning_log.id,
            "completed_at": current_time.isoformat(),
            "cleaning_stats": {
                "today_count": today_count,
                "total_entries": len(recent_cleanings),
                "last_cleaned": current_time.isoformat()
            },
            "recent_cleanings": [
                {
                    "id": log.id,
                    "staff_name": log.staff_name,
                    "completed_at": log.completed_at.isoformat(),
                    "method": log.method,
                    "notes": log.notes
                }
                for log in recent_cleanings
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing cleaning task for {restaurant_code}/{asset_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete cleaning task: {str(e)}"
        )

@router.get("/clean/{asset_id}/logs")
async def get_cleaning_logs(
    asset_id: str,
    days: int = 7,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """
    Get cleaning logs for a specific asset
    """
    try:
        start_date = datetime.now() - timedelta(days=days)
        
        logs = crud.get_cleaning_logs_by_asset_and_date_range(
            db, asset_id, current_restaurant.id, start_date
        )
        
        # Group by date for better presentation
        logs_by_date = {}
        for log in logs:
            date_key = log.completed_at.date().isoformat()
            if date_key not in logs_by_date:
                logs_by_date[date_key] = []
            
            logs_by_date[date_key].append({
                "id": log.id,
                "staff_name": log.staff_name,
                "completed_at": log.completed_at.isoformat(),
                "method": log.method,
                "time": log.completed_at.strftime("%H:%M")
            })
        
        return {
            "asset_id": asset_id,
            "asset_name": asset_id.replace('-', ' ').title(),
            "date_range": {
                "start": start_date.date().isoformat(),
                "end": datetime.now().date().isoformat(),
                "days": days
            },
            "total_cleanings": len(logs),
            "logs_by_date": logs_by_date
        }
        
    except Exception as e:
        logger.error(f"Error fetching cleaning logs for {asset_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch cleaning logs: {str(e)}"
        )

@router.get("/assets/{restaurant_id}")
async def get_nfc_assets(
    restaurant_id: int,
    current_restaurant: models.Restaurant = Depends(auth.get_current_restaurant),
    db: Session = Depends(get_db)
):
    """
    Get all NFC-enabled assets for a restaurant
    """
    if current_restaurant.id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        # Get all unique asset IDs from cleaning tasks
        assets = crud.get_nfc_assets_by_restaurant(db, restaurant_id)
        
        return {
            "restaurant_id": restaurant_id,
            "assets": [
                {
                    "asset_id": asset.asset_id,
                    "asset_name": asset.asset_id.replace('-', ' ').title(),
                    "nfc_url": f"https://task-module.up.railway.app/nfc/clean/{asset.asset_id}",
                    "qr_url": f"https://task-module.up.railway.app/nfc/clean/{asset.asset_id}",
                    "total_tasks": asset.task_count,
                    "last_cleaned": asset.last_cleaned.isoformat() if asset.last_cleaned else None
                }
                for asset in assets
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching NFC assets for restaurant {restaurant_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch NFC assets: {str(e)}"
        )
