#!/usr/bin/env python3
"""
Production Database Setup Script for Railway PostgreSQL
This script will:
1. Initialize the database tables
2. Create a default restaurant for testing
3. Create admin and staff users
"""

import sys
import os
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app import models, schemas, crud
from app.config import settings
import secrets
import string
from sqlalchemy import text

def generate_secure_restaurant_code() -> str:
    """Generate a secure 8-character restaurant code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(8))

def fix_media_file_table():
    """Fix MediaFile table by adding missing columns for PostgreSQL"""
    print("🔧 Fixing MediaFile table for PostgreSQL compatibility...")
    
    try:
        with engine.connect() as connection:
            # SQL commands to add missing columns
            sql_commands = [
                # Add file_url column if it doesn't exist
                """
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'media_files' AND column_name = 'file_url') THEN
                        ALTER TABLE media_files ADD COLUMN file_url VARCHAR(1000);
                        RAISE NOTICE 'Added file_url column';
                    ELSE
                        RAISE NOTICE 'file_url column already exists';
                    END IF;
                END $$;
                """,
                
                # Add storage_type column if it doesn't exist
                """
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'media_files' AND column_name = 'storage_type') THEN
                        ALTER TABLE media_files ADD COLUMN storage_type VARCHAR(50);
                        RAISE NOTICE 'Added storage_type column';
                    ELSE
                        RAISE NOTICE 'storage_type column already exists';
                    END IF;
                END $$;
                """,
                
                # Add cloudinary_id column if it doesn't exist
                """
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'media_files' AND column_name = 'cloudinary_id') THEN
                        ALTER TABLE media_files ADD COLUMN cloudinary_id VARCHAR(255);
                        RAISE NOTICE 'Added cloudinary_id column';
                    ELSE
                        RAISE NOTICE 'cloudinary_id column already exists';
                    END IF;
                END $$;
                """,
                
                # Update existing records with default values
                """
                UPDATE media_files 
                SET 
                    file_url = COALESCE(file_url, file_path),
                    storage_type = COALESCE(storage_type, 'local')
                WHERE file_url IS NULL OR storage_type IS NULL;
                """,
            ]
            
            with connection.begin():
                for i, sql in enumerate(sql_commands, 1):
                    try:
                        connection.execute(text(sql))
                        print(f"  ✅ Command {i} executed successfully")
                    except Exception as e:
                        print(f"  ⚠️ Command {i} warning: {e}")
                        # Continue with other commands
                        continue
            
            print("✅ MediaFile table PostgreSQL compatibility fix completed!")
            
    except Exception as e:
        print(f"❌ MediaFile table fix failed: {e}")
        # Don't fail the entire initialization for this

def init_production_database():
    """Initialize the production database"""
    print("🚀 Initializing Production Database...")
    print(f"📊 Database URL: {settings.DATABASE_URL[:50]}...")
    print(f"🌍 Environment: {settings.ENVIRONMENT}")
    
    try:
        # Create all tables
        print("📋 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # Fix MediaFile table for PostgreSQL compatibility
        fix_media_file_table()
        
        # Print table information
        tables = Base.metadata.tables.keys()
        print(f"📋 Created tables: {', '.join(tables)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        return False

def create_default_restaurant():
    """Create a default restaurant for production testing"""
    db = SessionLocal()
    
    try:
        # Check if any restaurants already exist
        existing_count = db.query(models.Restaurant).count()
        
        if existing_count > 0:
            print(f"🏪 Found {existing_count} existing restaurants in database")
            
            # List existing restaurants
            restaurants = db.query(models.Restaurant).all()
            for restaurant in restaurants:
                print(f"   - {restaurant.name} (Code: {restaurant.restaurant_code})")
                
                # Check for users
                user_count = db.query(models.User).filter(
                    models.User.restaurant_id == restaurant.id
                ).count()
                print(f"     Users: {user_count}")
            
            return True
        
        # Generate a secure restaurant code
        restaurant_code = generate_secure_restaurant_code()
        
        print("🏪 Creating default production restaurant...")
        restaurant_data = schemas.RestaurantCreate(
            name="Railway Restaurant",
            cuisine_type="Multi-Cuisine",
            contact_email="admin@railway.restaurant",
            contact_phone="+1-555-RAILWAY",
            password="Railway2025!SecurePass",
            locations=[
                schemas.LocationCreate(
                    address_line1="Railway Cloud Platform",
                    town_city="Cloud City",
                    postcode="RAIL1"
                )
            ]
        )
        
        restaurant = crud.create_restaurant(db, restaurant_data)
        print(f"✅ Created restaurant: {restaurant.name}")
        print(f"🔑 Restaurant Code: {restaurant.restaurant_code}")
        print(f"📧 Email: {restaurant.contact_email}")
        print(f"🔐 Password: [HIDDEN FOR SECURITY]")
        
        # Create admin and staff users
        print("👥 Creating default users...")
        
        # Generate secure PINs
        admin_pin = ''.join(secrets.choice(string.digits) for _ in range(4))
        staff_pin = ''.join(secrets.choice(string.digits) for _ in range(4))
        
        # Admin user
        admin_user = models.User(
            restaurant_id=restaurant.id,
            name="Restaurant Admin",
            pin=admin_pin,
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        
        # Staff user
        staff_user = models.User(
            restaurant_id=restaurant.id,
            name="Restaurant Staff",
            pin=staff_pin,
            role="staff",
            is_active=True
        )
        db.add(staff_user)
        
        db.commit()
        
        print(f"   ✅ Admin User - PIN: {admin_pin}")
        print(f"   ✅ Staff User - PIN: {staff_pin}")
        
        # Display summary
        print("\n🎯 Production Setup Complete!")
        print("=" * 50)
        print(f"🏪 Restaurant: {restaurant.name}")
        print(f"🔑 Login Code: {restaurant.restaurant_code}")
        print(f"🔐 Password: [HIDDEN FOR SECURITY]")
        print(f"👨‍💼 Admin PIN: {admin_pin}")
        print(f"👨‍🍳 Staff PIN: {staff_pin}")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating default restaurant: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def verify_database_connection():
    """Verify database connection and basic functionality"""
    print("🔍 Verifying database connection...")
    
    try:
        db = SessionLocal()
        
        # Test basic query
        restaurant_count = db.query(models.Restaurant).count()
        user_count = db.query(models.User).count()
        task_count = db.query(models.Task).count()
        
        print(f"✅ Database connection successful!")
        print(f"📊 Restaurants: {restaurant_count}")
        print(f"👥 Users: {user_count}")
        print(f"📋 Tasks: {task_count}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def clear_database():
    """Clear all data from the database (use with caution!)"""
    response = input("⚠️  This will DELETE ALL DATA from the database! Type 'CONFIRM DELETE' to proceed: ")
    
    if response != "CONFIRM DELETE":
        print("❌ Database clear cancelled.")
        return False
    
    print("🗑️  Clearing database...")
    
    try:
        db = SessionLocal()
        
        # Delete in reverse order of dependencies
        db.query(models.Task).delete()
        db.query(models.User).delete()
        db.query(models.Location).delete()
        db.query(models.Restaurant).delete()
        
        db.commit()
        db.close()
        
        print("✅ Database cleared successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error clearing database: {e}")
        return False

if __name__ == "__main__":
    print("🎯 Railway Production Database Setup")
    print("=" * 40)
    
    # Check if user wants to clear database first
    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        if not clear_database():
            sys.exit(1)
    
    # Initialize database
    if not init_production_database():
        print("❌ Database initialization failed!")
        sys.exit(1)
    
    # Create default restaurant if none exists
    if not create_default_restaurant():
        print("❌ Default restaurant creation failed!")
        sys.exit(1)
    
    # Verify everything is working
    if not verify_database_connection():
        print("❌ Database verification failed!")
        sys.exit(1)
    
    print("\n🚀 Production database setup completed successfully!")
    print("🌐 Backend URL: https://radiant-amazement-production-d68f.up.railway.app")
    print("🌐 Frontend URL: https://task-module.up.railway.app")
