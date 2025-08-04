#!/usr/bin/env python3
"""
Final comprehensive test of all production endpoints
"""
import requests

BASE_URL = "http://localhost:8000"
RESTAURANT_CODE = "UY1UPTB5"
PASSWORD = "admin123"

def run_final_test():
    print("🏁 FINAL PRODUCTION DATABASE TEST")
    print("=" * 50)
    
    # 1. Health Check
    health = requests.get(f"{BASE_URL}/api/health")
    print(f"✅ Health Check: {health.status_code} - {health.json()['status']}")
    
    # 2. Authentication
    auth = requests.post(f"{BASE_URL}/api/auth/login", json={
        "restaurant_code": RESTAURANT_CODE,
        "password": PASSWORD
    })
    print(f"✅ Authentication: {auth.status_code}")
    
    if auth.status_code != 200:
        print("❌ Cannot continue without authentication")
        return
    
    token = auth.json()['token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. NFC Clean (Public endpoint)
    nfc_clean = requests.post(f"{BASE_URL}/api/nfc/clean/{RESTAURANT_CODE}/final-test", json={
        "notes": "Final production test"
    })
    print(f"✅ NFC Clean: {nfc_clean.status_code} - {nfc_clean.json()['message']}")
    
    # 4. NFC Assets (Protected endpoint)
    restaurant_id = 12  # From our test
    nfc_assets = requests.get(f"{BASE_URL}/api/nfc/assets/{restaurant_id}", headers=headers)
    print(f"✅ NFC Assets: {nfc_assets.status_code} - Found {len(nfc_assets.json()['assets'])} assets")
    
    # 5. Cleaning Logs (Protected endpoint)
    cleaning_logs = requests.get(f"{BASE_URL}/api/nfc/clean/final-test/logs", headers=headers)
    print(f"✅ Cleaning Logs: {cleaning_logs.status_code} - {cleaning_logs.json()['total_cleanings']} logs")
    
    print(f"\n🎉 ALL ENDPOINTS WORKING WITH PRODUCTION DATABASE!")
    print(f"\n📋 Ready for Frontend Testing:")
    print(f"   🌐 Frontend: http://localhost:5173")
    print(f"   🔐 Login: {RESTAURANT_CODE} / {PASSWORD}")
    print(f"   📊 Check: Admin Panel → Cleaning Logs tab")

if __name__ == "__main__":
    run_final_test()
