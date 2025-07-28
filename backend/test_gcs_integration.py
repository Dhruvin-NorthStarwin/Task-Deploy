#!/usr/bin/env python3
"""
Test Google Cloud Storage Integration
"""
import os
import sys

# Add current directory to path
sys.path.insert(0, os.getcwd())

print("🧪 Testing Google Cloud Storage Integration")
print("=" * 50)

try:
    print("1. Loading environment...")
    from dotenv import load_dotenv
    load_dotenv()
    print(f"   ✅ Environment loaded")
    
    print("2. Testing configuration...")
    from app.config import settings
    print(f"   ✅ Config loaded")
    print(f"   📋 GCS Enabled: {settings.USE_CLOUD_STORAGE}")
    print(f"   📋 Bucket Name: {settings.GCS_BUCKET_NAME}")
    print(f"   📋 Credentials: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
    
    print("3. Testing file service...")
    from app.services.file_service import file_service
    print(f"   ✅ File service created")
    print(f"   📋 Cloud Storage: {file_service.use_cloud_storage}")
    print(f"   📋 Bucket Name: {file_service.gcs_bucket_name}")
    
    if file_service.use_cloud_storage:
        print(f"   📋 GCS Client: {file_service.gcs_client is not None}")
        print(f"   📋 GCS Bucket: {file_service.gcs_bucket is not None}")
    
    print("4. Testing FastAPI app...")
    from main import app
    print(f"   ✅ FastAPI app created")
    
    print("\n🎉 All tests passed!")
    
except Exception as e:
    import traceback
    print(f"❌ Test failed: {e}")
    print(f"📋 Traceback:")
    traceback.print_exc()
