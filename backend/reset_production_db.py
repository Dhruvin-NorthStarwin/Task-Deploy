#!/usr/bin/env python3
"""
Database Reset Script for Production
This script will completely clear the database and set it up fresh
"""

import sys
import os
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app import models
from app.config import settings

def reset_database():
    """Drop all tables and recreate them"""
    print("🗑️  Resetting production database...")
    print(f"📊 Database URL: {settings.DATABASE_URL[:50]}...")
    
    try:
        # Drop all tables
        print("🔥 Dropping all existing tables...")
        Base.metadata.drop_all(bind=engine)
        print("✅ All tables dropped")
        
        # Recreate all tables
        print("🔧 Creating fresh tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Fresh tables created")
        
        # Verify tables exist
        tables = Base.metadata.tables.keys()
        print(f"📋 Created tables: {', '.join(tables)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        return False

def clear_all_data():
    """Clear all data from existing tables without dropping them"""
    print("🧹 Clearing all data from database...")
    
    try:
        db = SessionLocal()
        
        # Get current counts
        task_count = db.query(models.Task).count()
        user_count = db.query(models.User).count()
        location_count = db.query(models.Location).count()
        restaurant_count = db.query(models.Restaurant).count()
        
        print(f"📊 Current data: {restaurant_count} restaurants, {user_count} users, {task_count} tasks, {location_count} locations")
        
        # Delete in reverse order of dependencies
        print("🗑️  Deleting tasks...")
        db.query(models.Task).delete()
        
        print("🗑️  Deleting users...")
        db.query(models.User).delete()
        
        print("🗑️  Deleting locations...")
        db.query(models.Location).delete()
        
        print("🗑️  Deleting restaurants...")
        db.query(models.Restaurant).delete()
        
        db.commit()
        db.close()
        
        print("✅ All data cleared successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error clearing data: {e}")
        if db:
            db.rollback()
            db.close()
        return False

if __name__ == "__main__":
    print("💣 Database Reset Script for Production")
    print("=" * 40)
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--reset":
            print("⚠️  This will DROP ALL TABLES and recreate them!")
            response = input("Type 'RESET TABLES' to confirm: ")
            if response == "RESET TABLES":
                if reset_database():
                    print("✅ Database reset completed!")
                else:
                    print("❌ Database reset failed!")
                    sys.exit(1)
            else:
                print("❌ Reset cancelled.")
                sys.exit(1)
        
        elif sys.argv[1] == "--clear":
            print("⚠️  This will DELETE ALL DATA but keep tables!")
            response = input("Type 'CLEAR DATA' to confirm: ")
            if response == "CLEAR DATA":
                if clear_all_data():
                    print("✅ Data clearing completed!")
                else:
                    print("❌ Data clearing failed!")
                    sys.exit(1)
            else:
                print("❌ Clear cancelled.")
                sys.exit(1)
    else:
        print("Usage:")
        print("  python reset_production_db.py --reset   # Drop and recreate all tables")
        print("  python reset_production_db.py --clear   # Clear all data but keep tables")
        sys.exit(1)
