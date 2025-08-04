#!/usr/bin/env python3
"""
Test script to create cleaning logs without staff_name and method
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_create_cleaning_log_simple():
    """Create a test cleaning log via NFC endpoint (public endpoint)"""
    
    # Test data
    test_data = [
        ("9WW5HHYW", "table-1", "Cleaned table thoroughly"),
        ("9WW5HHYW", "table-2", "Wiped down and sanitized"),
        ("9WW5HHYW", "main-freezer", "Deep cleaned and organized"),
        ("9WW5HHYW", "prep-counter", "Sanitized prep area")
    ]
    
    print("🧪 Testing New Cleaning Log Creation (without staff_name/method)")
    print("=" * 60)
    
    for restaurant_code, asset_id, notes in test_data:
        try:
            response = requests.post(f"{BASE_URL}/api/nfc/clean/{restaurant_code}/{asset_id}", 
                                   json={
                                       "notes": notes
                                   })
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Created log for {asset_id}: {data.get('message')}")
                print(f"   Log ID: {data.get('log_id')}")
            else:
                print(f"❌ Failed to create log for {asset_id}: {response.status_code}")
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"❌ Exception for {asset_id}: {e}")
    
    print("\n✅ Test completed!")

if __name__ == "__main__":
    test_create_cleaning_log_simple()
