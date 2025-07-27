#!/usr/bin/env python3
"""
Database initialization script for RestroManage Backend
"""

import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import engine
from app.models import Base
from app.config import settings

def init_database():
    """Initialize the database tables"""
    print("🗄️  Initializing database...")
    print(f"Database URL: {settings.DATABASE_URL}")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # Print table information
        tables = Base.metadata.tables.keys()
        print(f"📋 Created tables: {', '.join(tables)}")
        
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        return False
    
    return True

if __name__ == "__main__":
    init_database()
