#!/usr/bin/env python3
"""
Test script for Cloudinary integration
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.cloudinary_service import CloudinaryService
from app.config import settings
import base64

def test_cloudinary():
    """Test Cloudinary configuration and upload"""
    
    print("🔍 Testing Cloudinary Configuration...")
    print(f"Cloud Name: {settings.CLOUDINARY_CLOUD_NAME}")
    print(f"API Key: {settings.CLOUDINARY_API_KEY}")
    print(f"Use Cloud Storage: {settings.USE_CLOUD_STORAGE}")
    
    # Create a simple test image (1x1 pixel PNG)
    test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGARH0WgAAAABJRU5ErkJggg=="
    
    print("\n🧪 Testing base64 detection...")
    
    # Test 1: Pure base64
    is_base64 = CloudinaryService.is_base64_image(test_image_base64)
    print(f"Pure base64 detection: {is_base64}")
    
    # Test 2: Data URL format
    data_url = f"data:image/png;base64,{test_image_base64}"
    is_data_url = CloudinaryService.is_base64_image(data_url)
    print(f"Data URL detection: {is_data_url}")
    
    # Test 3: Regular URL (should be False)
    regular_url = "https://example.com/image.png"
    is_regular = CloudinaryService.is_base64_image(regular_url)
    print(f"Regular URL detection (should be False): {is_regular}")
    
    print("\n☁️ Testing Cloudinary upload...")
    
    try:
        # Upload test image
        upload_result = CloudinaryService.upload_base64_image(
            data_url,
            folder="test",
            public_id="test_upload"
        )
        
        if upload_result:
            print(f"✅ Upload successful: {upload_result}")
            
            # Test cleanup
            print("\n🧹 Testing cleanup...")
            delete_result = CloudinaryService.delete_by_url(upload_result)
            print(f"Delete result: {delete_result}")
            
        else:
            print("❌ Upload failed")
            
    except Exception as e:
        print(f"❌ Error during upload test: {e}")

if __name__ == "__main__":
    test_cloudinary()
