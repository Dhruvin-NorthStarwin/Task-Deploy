#!/usr/bin/env python3
"""
Test script for admin media preview functionality
"""
import requests
import json

def test_admin_media_endpoints():
    """Test the admin media preview endpoints"""
    base_url = "http://localhost:8000/api"
    
    print("🧪 Testing Admin Media Preview Endpoints")
    print("=" * 50)
    
    # Test endpoints without authentication first to verify they exist
    endpoints = [
        "/admin/media/gallery",
        "/admin/media/preview?url=https://res.cloudinary.com/dxmdswaly/image/upload/v1734955893/task_images/sample.jpg",
        "/admin/media/tasks/1/media"
    ]
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        try:
            response = requests.get(url)
            print(f"\n📍 Testing: {endpoint}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print("   ✅ Endpoint exists (requires authentication)")
            elif response.status_code == 200:
                print("   ✅ Endpoint accessible")
                try:
                    data = response.json()
                    print(f"   📊 Response: {json.dumps(data, indent=2)}")
                except:
                    print(f"   📄 Response: {response.text[:200]}...")
            else:
                print(f"   ❌ Unexpected status: {response.text[:200]}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Admin Media Endpoint Test Complete")

def test_cloudinary_service():
    """Test Cloudinary service methods directly"""
    print("\n🧪 Testing Cloudinary Service Methods")
    print("=" * 50)
    
    try:
        from app.services.cloudinary_service import CloudinaryService
        
        # Test with a sample Cloudinary URL
        test_url = "https://res.cloudinary.com/dxmdswaly/image/upload/v1734955893/task_images/sample.jpg"
        
        print(f"\n📍 Testing get_media_info with: {test_url}")
        media_info = CloudinaryService.get_media_info(test_url)
        print(f"   📊 Media Info: {json.dumps(media_info, indent=2)}")
        
        print(f"\n📍 Testing generate_preview_urls")
        preview_urls = CloudinaryService.generate_preview_urls(test_url, "image")
        print(f"   📊 Preview URLs: {json.dumps(preview_urls, indent=2)}")
        
    except Exception as e:
        print(f"   ❌ Error testing Cloudinary service: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Cloudinary Service Test Complete")

if __name__ == "__main__":
    test_admin_media_endpoints()
    test_cloudinary_service()
