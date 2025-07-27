#!/usr/bin/env python3
"""
Database reset script for testing
"""

from app.database import engine
from app.models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    """Drop all tables and recreate them"""
    try:
        logger.info("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        
        logger.info("Creating all tables...")
        Base.metadata.create_all(bind=engine)
        
        logger.info("Database reset completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        return False

if __name__ == "__main__":
    success = reset_database()
    if success:
        print("✅ Database reset successful!")
    else:
        print("❌ Database reset failed!")
