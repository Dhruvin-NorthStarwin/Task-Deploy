#!/usr/bin/env python3
"""
Test File Upload Capabilities with Google Cloud Storage
"""
import os
import sys
import asyncio
from io import BytesIO
from PIL import Image

# Add current directory to path
sys.path.insert(0, os.getcwd())

async def test_file_operations():
    """Test file upload operations"""
    print("🧪 Testing File Operations with Google Cloud Storage")
    print("=" * 55)
    
    try:
        # Load environment
        from dotenv import load_dotenv
        load_dotenv()
        
        from app.services.file_service import file_service
        
        print("1. File Service Status:")
        print(f"   ✅ Cloud Storage: {file_service.use_cloud_storage}")
        print(f"   📦 Bucket: {file_service.gcs_bucket_name}")
        print(f"   🔧 Client Ready: {file_service.gcs_client is not None}")
        
        print("\n2. Supported File Types:")
        print(f"   🖼️  Images: {', '.join(file_service.allowed_image_types)}")
        print(f"   🎥 Videos: {', '.join(file_service.allowed_video_types)}")
        print(f"   📏 Max Size: {file_service.max_file_size / (1024*1024):.1f} MB")
        
        print("\n3. Testing Image Processing:")
        # Create a test image
        test_image = Image.new('RGB', (2000, 1500), color='red')
        img_bytes = BytesIO()
        test_image.save(img_bytes, format='JPEG')
        img_content = img_bytes.getvalue()
        
        print(f"   📊 Original Image: 2000x1500 pixels, {len(img_content)} bytes")
        
        # Test optimization
        optimized_content = await file_service._optimize_image_content(img_content)
        print(f"   ⚡ Optimized: {len(optimized_content)} bytes ({len(optimized_content)/len(img_content)*100:.1f}% of original)")
        
        print("\n4. Storage Configuration:")
        if file_service.use_cloud_storage:
            try:
                bucket = file_service.gcs_bucket
                print(f"   ✅ Bucket exists: {bucket.exists()}")
                if bucket.exists():
                    print(f"   📍 Location: {bucket.location}")
                    print(f"   💾 Storage Class: {bucket.storage_class}")
                else:
                    print("   ℹ️  Bucket will be created on first upload")
            except Exception as e:
                print(f"   ⚠️  Bucket check failed: {e}")
                print("   💡 This is normal if billing is not enabled")
        
        print("\n5. File URL Generation:")
        # Test URL generation
        sample_path = "task_completions/123/sample-image.jpg"
        if file_service.use_cloud_storage:
            url = file_service.get_file_url(sample_path, "", "gcs")
            print(f"   🌐 GCS URL: {url}")
        
        local_url = file_service.get_file_url("./uploads/test.jpg", "http://localhost:8000", "local")
        print(f"   🏠 Local URL: {local_url}")
        
        print("\n🎉 File Operations Test Complete!")
        
        return True
        
    except Exception as e:
        import traceback
        print(f"❌ Test failed: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_file_operations())
