#!/usr/bin/env python3
"""
Quick test to check what's in production database and create test data
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_correct():
    """Test the correct health endpoint path"""
    try:
        # Try different paths
        paths = ["/health", "/api/health", "/"]
        
        for path in paths:
            try:
                result = requests.get(f"{BASE_URL}{path}")
                print(f"Testing {BASE_URL}{path}: {result.status_code}")
                if result.status_code == 200:
                    if path == "/":
                        print(f"   Root response: {result.text[:100]}...")
                    else:
                        print(f"   Health OK: {result.json() if result.content else 'No JSON'}")
            except Exception as e:
                print(f"   Error: {e}")
    except Exception as e:
        print(f"Health test error: {e}")

def create_test_restaurant():
    """Create a test restaurant in production"""
    print("\n🏗️ Creating Test Restaurant in Production")
    print("-" * 40)
    
    try:
        # Try to register a new restaurant
        restaurant_data = {
            "restaurant_code": "PROD001",  # Will be auto-generated, this is ignored
            "password": "admin123",
            "name": "Production Test Restaurant",
            "cuisine_type": "International",
            "contact_email": "test@production.com",
            "contact_phone": "+1234567890",
            "locations": [
                {
                    "address_line1": "123 Production St",
                    "town_city": "Production City",
                    "postcode": "P1 2P3"
                }
            ]
        }
        
        result = requests.post(f"{BASE_URL}/api/auth/register", json=restaurant_data)
        
        if result.status_code == 200:
            data = result.json()
            print(f"✅ Restaurant created successfully!")
            print(f"   Restaurant Code: {data.get('restaurant_code')}")
            print(f"   Restaurant ID: {data.get('restaurant_id')}")
            return data.get('restaurant_code')
        else:
            print(f"❌ Failed to create restaurant: {result.status_code}")
            print(f"   Error: {result.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating restaurant: {e}")
        return None

def test_auth_with_created_restaurant(restaurant_code):
    """Test authentication with the created restaurant"""
    if not restaurant_code:
        return None
        
    print(f"\n🔐 Testing Authentication with {restaurant_code}")
    print("-" * 40)
    
    try:
        result = requests.post(f"{BASE_URL}/api/auth/login", json={
            "restaurant_code": restaurant_code,
            "password": "admin123"
        })
        
        if result.status_code == 200:
            data = result.json()
            print(f"✅ Authentication successful!")
            print(f"   Token: {data.get('token')[:20]}...")
            return data.get('token')
        else:
            print(f"❌ Authentication failed: {result.status_code}")
            print(f"   Error: {result.text}")
            return None
            
    except Exception as e:
        print(f"❌ Auth error: {e}")
        return None

def test_admin_endpoints(token, restaurant_id):
    """Test admin endpoints with authentication"""
    if not token:
        return
        
    print(f"\n🔧 Testing Admin Endpoints")
    print("-" * 40)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test getting NFC assets
    try:
        result = requests.get(f"{BASE_URL}/api/nfc/assets/{restaurant_id}", headers=headers)
        if result.status_code == 200:
            data = result.json()
            print(f"✅ NFC Assets endpoint working")
            print(f"   Found {len(data.get('assets', []))} assets")
        else:
            print(f"❌ NFC Assets failed: {result.status_code}")
    except Exception as e:
        print(f"❌ NFC Assets error: {e}")
    
    # Test getting cleaning logs (if any assets exist)
    # We'll use a test asset from our cleaning log creation
    try:
        result = requests.get(f"{BASE_URL}/api/nfc/clean/test-asset-1/logs", headers=headers)
        if result.status_code == 200:
            data = result.json()
            print(f"✅ Cleaning Logs endpoint working")
            print(f"   Found {data.get('total_cleanings', 0)} logs")
        else:
            print(f"❌ Cleaning Logs failed: {result.status_code}")
    except Exception as e:
        print(f"❌ Cleaning Logs error: {e}")

def main():
    print("🧪 Production Database Setup & Testing")
    print("=" * 50)
    
    # Test health endpoints
    test_health_correct()
    
    # Create test restaurant
    restaurant_code = create_test_restaurant()
    
    if restaurant_code:
        # Test authentication
        token = test_auth_with_created_restaurant(restaurant_code)
        
        if token:
            # Create some cleaning logs for this restaurant
            print(f"\n🧽 Creating Cleaning Logs for {restaurant_code}")
            print("-" * 40)
            
            assets = ["table-1", "table-2", "freezer-main", "prep-station"]
            for asset in assets:
                try:
                    result = requests.post(f"{BASE_URL}/api/nfc/clean/{restaurant_code}/{asset}", json={
                        "notes": f"Production test cleaning of {asset}"
                    })
                    if result.status_code == 200:
                        data = result.json()
                        print(f"✅ Created log for {asset}: ID {data.get('log_id')}")
                    else:
                        print(f"❌ Failed to create log for {asset}")
                except Exception as e:
                    print(f"❌ Error creating log for {asset}: {e}")
            
            # Get restaurant ID from token or restaurant data
            # For now, let's assume it's 1 (first restaurant)
            test_admin_endpoints(token, 1)
    
    print(f"\n🎉 Production database testing complete!")

if __name__ == "__main__":
    main()
