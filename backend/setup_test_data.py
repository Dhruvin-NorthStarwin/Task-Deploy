#!/usr/bin/env python3
"""
Setup test data for restaurant authentication testing
"""

import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app import crud, models, schemas
from app.auth import get_password_hash

def setup_test_restaurant():
    """Create a test restaurant with admin and staff users"""
    db = SessionLocal()
    
    try:
        # Check if test restaurant already exists
        existing = db.query(models.Restaurant).filter(
            models.Restaurant.contact_email == "test@example.com"
        ).first()
        
        if existing:
            print(f"✅ Test restaurant already exists with code: {existing.restaurant_code}")
            print(f"📧 Email: {existing.contact_email}")
            print(f"🔑 Use password: 'password123'")
            
            # Check for users
            users = db.query(models.User).filter(
                models.User.restaurant_id == existing.id
            ).all()
            
            if users:
                print(f"👥 Existing users:")
                for user in users:
                    print(f"   - {user.name} ({user.role}) - PIN: {user.pin}")
            else:
                print("👥 Creating test users...")
                create_test_users(db, existing.id)
            
            return existing
        
        # Create test restaurant
        print("🏪 Creating test restaurant...")
        restaurant_data = schemas.RestaurantCreate(
            name="Test Restaurant",
            cuisine_type="Italian",
            contact_email="test@example.com",
            contact_phone="123-456-7890",
            password="password123",
            locations=[
                schemas.LocationCreate(
                    address_line1="123 Test Street",
                    town_city="Test City",
                    postcode="12345"
                )
            ]
        )
        
        restaurant = crud.create_restaurant(db, restaurant_data)
        print(f"✅ Created restaurant with code: {restaurant.restaurant_code}")
        print(f"📧 Email: {restaurant.contact_email}")
        print(f"🔑 Password: 'password123'")
        
        # Create test users
        print("👥 Creating test users...")
        create_test_users(db, restaurant.id)
        
        return restaurant
        
    except Exception as e:
        print(f"❌ Error setting up test restaurant: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def create_test_users(db: Session, restaurant_id: int):
    """Create test admin and staff users"""
    
    # Admin user
    admin_user = models.User(
        restaurant_id=restaurant_id,
        name="Admin User",
        pin="1234",
        role="admin",
        is_active=True
    )
    db.add(admin_user)
    
    # Staff user
    staff_user = models.User(
        restaurant_id=restaurant_id,
        name="Staff User",
        pin="5678",
        role="staff",
        is_active=True
    )
    db.add(staff_user)
    
    db.commit()
    
    print(f"   - Admin User (admin) - PIN: 1234")
    print(f"   - Staff User (staff) - PIN: 5678")

def list_all_restaurants():
    """List all restaurants in the database"""
    db = SessionLocal()
    
    try:
        restaurants = db.query(models.Restaurant).all()
        
        if not restaurants:
            print("🏪 No restaurants found in database")
            return
        
        print("🏪 All restaurants in database:")
        for restaurant in restaurants:
            print(f"   - {restaurant.name} (Code: {restaurant.restaurant_code})")
            print(f"     Email: {restaurant.contact_email}")
            
            # List users for this restaurant
            users = db.query(models.User).filter(
                models.User.restaurant_id == restaurant.id
            ).all()
            
            if users:
                print(f"     Users:")
                for user in users:
                    print(f"       - {user.name} ({user.role}) - PIN: {user.pin}")
            else:
                print(f"     No users found")
            print()
                
    except Exception as e:
        print(f"❌ Error listing restaurants: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Setting up test data for authentication...")
    
    # List existing restaurants
    print("\n📋 Current database state:")
    list_all_restaurants()
    
    # Setup test restaurant
    print("\n🏪 Setting up test restaurant:")
    restaurant = setup_test_restaurant()
    
    if restaurant:
        print(f"\n✅ Setup complete!")
        print(f"🔑 Login with:")
        print(f"   Restaurant Code: {restaurant.restaurant_code}")
        print(f"   Password: password123")
        print(f"   Then use PIN 1234 (admin) or 5678 (staff)")
    else:
        print("\n❌ Setup failed!")
