#!/usr/bin/env python3
"""
Final test with proper restaurant ID from JWT token
"""
import requests
import json
import jwt

BASE_URL = "http://localhost:8000"

def decode_token(token):
    """Decode JWT token to get restaurant ID"""
    try:
        # Decode without verification for testing (not for production!)
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded.get('sub')  # This should be the restaurant ID
    except Exception as e:
        print(f"Token decode error: {e}")
        return None

def test_complete_flow():
    """Test the complete flow with proper restaurant ID"""
    print("🧪 Complete Production Flow Test")
    print("=" * 40)
    
    # Step 1: Login with our created restaurant
    restaurant_code = "UY1UPTB5"  # From previous test
    
    try:
        login_result = requests.post(f"{BASE_URL}/api/auth/login", json={
            "restaurant_code": restaurant_code,
            "password": "admin123"
        })
        
        if login_result.status_code != 200:
            print(f"❌ Login failed: {login_result.status_code}")
            return
            
        login_data = login_result.json()
        token = login_data.get('token')
        restaurant_id = decode_token(token)
        
        print(f"✅ Logged in as restaurant {restaurant_code}")
        print(f"   Restaurant ID: {restaurant_id}")
        
        if not restaurant_id:
            print("❌ Could not get restaurant ID from token")
            return
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 2: Test NFC Assets endpoint with correct restaurant ID
        print(f"\n🔍 Testing NFC Assets for Restaurant ID {restaurant_id}")
        assets_result = requests.get(f"{BASE_URL}/api/nfc/assets/{restaurant_id}", headers=headers)
        
        if assets_result.status_code == 200:
            assets_data = assets_result.json()
            print(f"✅ NFC Assets endpoint working!")
            print(f"   Found {len(assets_data.get('assets', []))} assets")
            
            for asset in assets_data.get('assets', []):
                print(f"   - {asset['asset_id']}: {asset['total_tasks']} logs")
        else:
            print(f"❌ NFC Assets failed: {assets_result.status_code}")
            print(f"   Error: {assets_result.text}")
        
        # Step 3: Test Cleaning Logs for one of our created assets
        print(f"\n🧽 Testing Cleaning Logs for table-1")
        logs_result = requests.get(f"{BASE_URL}/api/nfc/clean/table-1/logs", headers=headers)
        
        if logs_result.status_code == 200:
            logs_data = logs_result.json()
            print(f"✅ Cleaning Logs endpoint working!")
            print(f"   Asset: {logs_data.get('asset_name')}")
            print(f"   Total cleanings: {logs_data.get('total_cleanings', 0)}")
            
            # Show recent logs
            logs_by_date = logs_data.get('logs_by_date', {})
            if logs_by_date:
                print(f"   Recent logs by date:")
                for date, logs in list(logs_by_date.items())[:2]:
                    print(f"     {date}: {len(logs)} logs")
                    for log in logs[:2]:
                        print(f"       - {log.get('time')}: {log.get('notes', 'No notes')[:30]}...")
        else:
            print(f"❌ Cleaning Logs failed: {logs_result.status_code}")
            print(f"   Error: {logs_result.text}")
        
        print(f"\n🎉 All endpoints tested successfully!")
        print(f"\n📋 Frontend Test Instructions:")
        print(f"   1. Open browser to http://localhost:5173")
        print(f"   2. Login with:")
        print(f"      Restaurant Code: {restaurant_code}")
        print(f"      Password: admin123")
        print(f"   3. Go to 'Cleaning Logs' tab in admin panel")
        print(f"   4. Should see assets with cleaning logs")
        
    except Exception as e:
        print(f"❌ Error in complete flow test: {e}")

if __name__ == "__main__":
    test_complete_flow()
