#!/usr/bin/env python3
"""
Health check script for the backend service
"""
import sys
import requests
import time

def health_check():
    """Check if the backend service is healthy"""
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            response = requests.get('http://localhost:8000/api/health', timeout=5)
            if response.status_code == 200:
                print("✅ Backend service is healthy!")
                return True
        except requests.exceptions.RequestException:
            pass
        
        print(f"🔄 Attempt {attempt + 1}/{max_attempts} - waiting for backend...")
        time.sleep(2)
    
    print("❌ Backend service failed to start")
    return False

if __name__ == "__main__":
    if not health_check():
        sys.exit(1)
