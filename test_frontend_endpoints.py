#!/usr/bin/env python3
"""
Test authentication and cleaning logs endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_login():
    """Login with test restaurant"""
    try:
        # Try different passwords for this restaurant
        passwords = ["securepass", "password123", "admin", "test123", "railway"]
        
        for password in passwords:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "restaurant_code": "9WW5HHYW",
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login successful with password: {password}")
                return data.get('token')
        
        print("❌ Login failed with all attempted passwords")
        return None
    except Exception as e:
        print(f"❌ Error logging in: {e}")
        return None

def test_get_nfc_assets(token, restaurant_id):
    """Get NFC assets for restaurant"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/nfc/assets/{restaurant_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data.get('assets', []))} NFC assets")
            return data
        else:
            print(f"❌ Failed to get NFC assets: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error getting NFC assets: {e}")
        return None

def test_get_cleaning_logs(token, asset_id):
    """Get cleaning logs for an asset"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/nfc/clean/{asset_id}/logs", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data.get('total_cleanings', 0)} cleaning logs for {asset_id}")
            return data
        else:
            print(f"❌ Failed to get cleaning logs: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error getting cleaning logs: {e}")
        return None

def main():
    print("🧪 Testing Frontend API Endpoints")
    print("=" * 50)
    
    # Test authentication
    print("\n🔐 Testing authentication...")
    token = test_login()
    
    if token:
        restaurant_id = 1  # From our database check
        
        # Test getting NFC assets
        print(f"\n📋 Testing NFC assets endpoint for restaurant {restaurant_id}...")
        assets_data = test_get_nfc_assets(token, restaurant_id)
        
        if assets_data:
            print(f"\nNFC Assets found:")
            for asset in assets_data.get('assets', []):
                print(f"  - {asset['asset_id']} ({asset['asset_name']}) - {asset['total_tasks']} logs")
            
            # Test getting cleaning logs for first asset
            if assets_data.get('assets'):
                asset_id = assets_data['assets'][0]['asset_id']
                print(f"\n📊 Testing cleaning logs for asset: {asset_id}")
                logs_data = test_get_cleaning_logs(token, asset_id)
                
                if logs_data:
                    print(f"\nCleaning Logs Summary:")
                    print(f"  Asset: {logs_data.get('asset_name')}")
                    print(f"  Total cleanings: {logs_data.get('total_cleanings')}")
                    print(f"  Date range: {logs_data.get('date_range', {}).get('days')} days")
                    
                    # Print some sample logs
                    logs_by_date = logs_data.get('logs_by_date', {})
                    if logs_by_date:
                        print(f"  Sample logs:")
                        for date, logs in list(logs_by_date.items())[:2]:  # First 2 dates
                            print(f"    {date}: {len(logs)} logs")
                            for log in logs[:2]:  # First 2 logs per date
                                print(f"      - {log.get('staff_name')} at {log.get('time')} ({log.get('method')})")
    else:
        print("❌ Authentication failed, cannot test other endpoints")
    
    print("\n🏁 Test completed!")

if __name__ == "__main__":
    main()
