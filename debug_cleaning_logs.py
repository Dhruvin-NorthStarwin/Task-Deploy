#!/usr/bin/env python3
"""
Debug script to test cleaning logs API endpoint
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_nfc_assets():
    """Test the NFC assets endpoint"""
    
    print("🔍 Testing NFC Assets Endpoint")
    print("=" * 50)
    
    # First test without authentication
    print("\n1. Testing without authentication:")
    try:
        response = requests.get(f"{BASE_URL}/api/nfc/assets/1")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test with a login first
    print("\n2. Testing with authentication:")
    try:
        # Login first
        login_data = {
            "restaurant_code": "test",
            "password": "testpass"
        }
        
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get('access_token')
            
            if token:
                headers = {'Authorization': f'Bearer {token}'}
                
                # Now test assets endpoint
                assets_response = requests.get(f"{BASE_URL}/api/nfc/assets/1", headers=headers)
                print(f"Assets Status: {assets_response.status_code}")
                print(f"Assets Response: {assets_response.text}")
            else:
                print("No token in response")
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_nfc_assets()
