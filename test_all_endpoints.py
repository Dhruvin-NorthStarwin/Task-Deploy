#!/usr/bin/env python3
"""
Test all main endpoints with production database
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_nfc_endpoints():
    """Test NFC endpoints (public)"""
    print("🧪 Testing NFC Endpoints")
    print("-" * 30)
    
    # Test creating cleaning logs
    result = requests.post(f"{BASE_URL}/api/nfc/clean/9WW5HHYW/test-asset-1", json={
        "notes": "Test cleaning from production test"
    })
    
    if result.status_code == 200:
        data = result.json()
        print(f"✅ NFC Clean endpoint working: {data.get('message')}")
        print(f"   Log ID: {data.get('log_id')}")
        return True
    else:
        print(f"❌ NFC Clean failed: {result.status_code} - {result.text}")
        return False

def test_restaurants_list():
    """Test getting restaurants (to find valid ones for auth)"""
    print("\n🧪 Testing Restaurant Discovery")
    print("-" * 30)
    
    # We'll do this by trying to connect to database via our backend
    # For now, let's use known restaurant codes from earlier tests
    known_codes = ["9WW5HHYW", "2GZR8QCW", "A7M1Y9S4"]
    
    for code in known_codes:
        try:
            result = requests.post(f"{BASE_URL}/api/auth/login", json={
                "restaurant_code": code,
                "password": "wrongpassword"  # We expect this to fail but tell us if restaurant exists
            })
            
            if result.status_code == 401:
                error_data = result.json()
                if "Invalid restaurant code" in error_data.get("detail", ""):
                    print(f"❌ Restaurant {code} not found")
                else:
                    print(f"✅ Restaurant {code} exists (but password wrong)")
            else:
                print(f"🤔 Unexpected response for {code}: {result.status_code}")
                
        except Exception as e:
            print(f"❌ Error testing {code}: {e}")

def test_health_endpoint():
    """Test basic health endpoint"""
    print("\n🧪 Testing Health Endpoint")
    print("-" * 30)
    
    try:
        result = requests.get(f"{BASE_URL}/health")
        if result.status_code == 200:
            print("✅ Health endpoint working")
            return True
        else:
            print(f"❌ Health endpoint failed: {result.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

def test_docs_endpoint():
    """Test API documentation endpoint"""
    print("\n🧪 Testing API Docs")
    print("-" * 30)
    
    try:
        result = requests.get(f"{BASE_URL}/docs")
        if result.status_code == 200:
            print("✅ API docs endpoint working")
            return True
        else:
            print(f"❌ API docs failed: {result.status_code}")
            return False
    except Exception as e:
        print(f"❌ API docs error: {e}")
        return False

def main():
    print("🔍 Testing Production Database Endpoints")
    print("=" * 50)
    
    # Test various endpoints
    health_ok = test_health_endpoint()
    docs_ok = test_docs_endpoint()
    nfc_ok = test_nfc_endpoints()
    test_restaurants_list()
    
    print(f"\n📊 Test Results Summary:")
    print(f"   Health Endpoint: {'✅' if health_ok else '❌'}")
    print(f"   API Docs: {'✅' if docs_ok else '❌'}")
    print(f"   NFC Endpoints: {'✅' if nfc_ok else '❌'}")
    
    if health_ok and docs_ok and nfc_ok:
        print(f"\n🎉 All core endpoints working with production database!")
    else:
        print(f"\n⚠️  Some endpoints have issues")

if __name__ == "__main__":
    main()
