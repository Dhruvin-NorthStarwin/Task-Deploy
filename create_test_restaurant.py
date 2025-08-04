#!/usr/bin/env python3
"""
Test script to create a test restaurant with known credentials
"""
import requests
import json
from passlib.context import CryptContext

BASE_URL = "http://localhost:8000"

def create_test_restaurant():
    """Create a test restaurant with known credentials"""
    
    # Create the password hash manually
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password_hash = pwd_context.hash("admin123")
    
    print("🏗️ Creating test restaurant...")
    print(f"Password hash: {password_hash}")
    
    # You would need to manually insert this into the database
    print("\nTo manually add to database, run this SQL:")
    print(f"""
INSERT INTO restaurants (restaurant_code, name, cuisine_type, contact_email, contact_phone, password_hash)
VALUES ('TEST001', 'Test Restaurant', 'International', 'test@example.com', '+1234567890', '{password_hash}');
""")

def test_auth():
    """Test authentication with known credentials"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "restaurant_code": "TEST001",
            "password": "admin123"
        })
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Authentication successful!")
            return data.get('token')
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    create_test_restaurant()
    print("\n" + "="*50)
    print("Testing authentication (if restaurant exists)...")
    test_auth()
