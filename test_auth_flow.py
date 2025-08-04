#!/usr/bin/env python3
"""
Test the complete authentication flow for cleaning logs
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_complete_flow():
    """Test complete authentication and cleaning logs flow"""
    
    print("🔍 Testing Complete Authentication Flow")
    print("=" * 50)
    
    # Step 1: Try to create a test restaurant and login
    try:
        # Check if TEST001 restaurant exists and try logging in
        login_data = {
            "restaurant_code": "TEST001",
            "password": "test123"
        }
        
        print("1. Attempting login...")
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            print(f"Login successful! Token type: {type(token_data)}")
            print(f"Response keys: {list(token_data.keys()) if isinstance(token_data, dict) else 'Not a dict'}")
            
            # Get the access token
            access_token = token_data.get('access_token') or token_data.get('token')
            if access_token:
                headers = {'Authorization': f'Bearer {access_token}'}
                
                # Get restaurant info to find restaurant_id
                restaurant_id = 12  # Use restaurant 12 which has cleaning logs
                print(f"Restaurant ID: {restaurant_id}")
                
                # Step 2: Test NFC assets endpoint
                print(f"\n2. Testing NFC assets for restaurant {restaurant_id}...")
                assets_response = requests.get(f"{BASE_URL}/api/nfc/assets/{restaurant_id}", headers=headers)
                print(f"Assets Status: {assets_response.status_code}")
                
                if assets_response.status_code == 200:
                    assets_data = assets_response.json()
                    print(f"Assets found: {len(assets_data.get('assets', []))}")
                    
                    # Step 3: Test cleaning logs for first asset
                    if assets_data.get('assets'):
                        asset_id = assets_data['assets'][0]['asset_id']
                        print(f"\n3. Testing cleaning logs for asset: {asset_id}")
                        logs_response = requests.get(f"{BASE_URL}/api/nfc/cleaning-logs/{asset_id}", headers=headers)
                        print(f"Logs Status: {logs_response.status_code}")
                        print(f"Logs Response: {logs_response.text[:200]}...")
                    else:
                        print("\n3. No assets found to test cleaning logs")
                else:
                    print(f"Assets Error: {assets_response.text}")
            else:
                print("No access_token found in response")
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_complete_flow()
