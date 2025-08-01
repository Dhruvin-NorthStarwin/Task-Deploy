from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any
import logging

from app.database import get_db
from app import crud, schemas, models, auth

router = APIRouter(prefix="/nfc", tags=["nfc"])
logger = logging.getLogger(__name__)

@router.post("/clean/{asset_id}")
async def complete_cleaning_task(
    asset_id: str,
    staff_info: schemas.NFCCleaningRequest,
    db: Session = Depends(get_db)
):
    """
    Complete a cleaning task via NFC tap (public endpoint for NFC)
    """
    try:
        # Find active cleaning task for this asset (any restaurant)
        cleaning_task = crud.get_active_cleaning_task_by_asset_public(
            db, asset_id
        )
        
        if not cleaning_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No active cleaning task found for {asset_id}"
            )
        
        # Mark task as completed
        task_update = schemas.TaskUpdate(
            status="Done",
            completed_at=datetime.now()
        )
        
        updated_task = crud.update_task(
            db, cleaning_task.id, cleaning_task.restaurant_id, task_update
        )
        
        # Create cleaning log entry
        cleaning_log_data = {
            "asset_id": asset_id,
            "task_id": cleaning_task.id,
            "restaurant_id": cleaning_task.restaurant_id,
            "staff_name": staff_info.staff_name or "Unknown Staff",
            "completed_at": datetime.now(),
            "method": "NFC"
        }
        
        cleaning_log = crud.create_cleaning_log(db, cleaning_log_data)
        
        # Get cleaning statistics for today
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = crud.get_cleaning_count_by_asset_and_date(
            db, asset_id, cleaning_task.restaurant_id, today_start
        )
        
        # Get last 10 cleaning entries for this asset
        recent_cleanings = crud.get_recent_cleaning_logs(
            db, asset_id, cleaning_task.restaurant_id, limit=10
        )
        
        return {
            "success": True,
            "message": f"{asset_id.replace('-', ' ').title()} marked as cleaned!",
            "asset_id": asset_id,
            "task_id": updated_task.id,
            "completed_at": updated_task.completed_at.isoformat(),
            "cleaning_stats": {
                "today_count": today_count,
                "total_entries": len(recent_cleanings),
                "last_cleaned": updated_task.completed_at.isoformat()
            },
            "recent_cleanings": [
                {
                    "id": log.id,
                    "staff_name": log.staff_name,
                    "completed_at": log.completed_at.isoformat(),
                    "method": log.method
                }
                for log in recent_cleanings
            ]
        }
        
    except Exception as e:
        logger.error(f"Error completing cleaning task for {asset_id}: {str(e)}")
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
