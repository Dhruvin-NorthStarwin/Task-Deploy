#!/usr/bin/env python3
"""
Test script for task submission with base64 image
"""

import requests
import json
import base64

# Test base64 image (1x1 pixel PNG)
test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGARH0WgAAAABJRU5ErkJggg=="
data_url = f"data:image/png;base64,{test_image_base64}"

def test_task_submission():
    """Test task submission with base64 image"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Task Submission with Base64 Image...")
    
    # Use an existing task ID from PostgreSQL database (task 2, restaurant 1)
    task_id = 2
    print(f"Testing with task ID: {task_id}")
    
    # Submit the task with base64 image
    print("📤 Submitting task with base64 image...")
    
    submission_data = {
        "image_url": data_url,
        "video_url": None,
        "initials": "TEST"
    }
    
    response = requests.patch(
        f"{base_url}/api/tasks/{task_id}/submit",
        json=submission_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        task_data = response.json()
        print(f"Response: {json.dumps(task_data, indent=2)}")
        
        if 'image_url' in task_data and task_data['image_url']:
            print(f"✅ Success! Image uploaded to: {task_data['image_url']}")
            print(f"Status: {task_data['status']}")
            
            # Verify it's a Cloudinary URL
            if 'cloudinary.com' in task_data['image_url']:
                print("✅ Confirmed: Using Cloudinary URL!")
            else:
                print("⚠️ Warning: Not a Cloudinary URL")
        else:
            print("❌ No image URL in response")
    else:
        print(f"❌ Error: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Error text: {response.text}")

if __name__ == "__main__":
    test_task_submission()
