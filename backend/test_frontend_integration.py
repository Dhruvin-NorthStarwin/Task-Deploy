#!/usr/bin/env python3
"""
Frontend Integration Test - Test the exact data format the frontend expects
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_frontend_data_format():
    """Test if the API returns data in the format the frontend expects"""
    
    # Create a task with frontend-style data
    frontend_task_data = {
        "task": "Test Frontend Task",
        "description": "Testing frontend integration",
        "category": "Cleaning",  # Frontend sends this
        "day": "monday",         # Frontend sends this
        "task_type": "Daily",    # Frontend sends this
        "image_required": False,
        "video_required": False
    }
    
    print("🔧 Testing Frontend Integration...")
    print("=" * 40)
    
    # Test 1: Create task with frontend data
    print("\n1️⃣ Creating task with frontend data format...")
    try:
        response = requests.post(f"{BASE_URL}/tasks", json=frontend_task_data)
        if response.status_code == 200:
            task = response.json()
            print("✅ Task created successfully!")
            print(f"   ID: {task['id']}")
            print(f"   Category: {task['category']} (type: {type(task['category'])})")
            print(f"   Day: {task['day']} (type: {type(task['day'])})")
            print(f"   Task Type: {task['task_type']} (type: {type(task['task_type'])})")
            print(f"   Status: {task['status']} (type: {type(task['status'])})")
            
            # Verify the data types and values match frontend expectations
            assert task['category'] == 'Cleaning', f"Expected 'Cleaning', got '{task['category']}'"
            assert task['day'] == 'monday', f"Expected 'monday', got '{task['day']}'"
            assert task['task_type'] == 'Daily', f"Expected 'Daily', got '{task['task_type']}'"
            assert task['status'] == 'Unknown', f"Expected 'Unknown', got '{task['status']}'"
            
            print("✅ All data types and values match frontend expectations!")
            
        else:
            print(f"❌ Failed to create task: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception during task creation: {e}")
    
    # Test 2: Retrieve tasks and verify format
    print("\n2️⃣ Retrieving tasks and verifying frontend compatibility...")
    try:
        response = requests.get(f"{BASE_URL}/tasks")
        if response.status_code == 200:
            tasks = response.json()
            print(f"✅ Retrieved {len(tasks)} tasks successfully!")
            
            if tasks:
                sample_task = tasks[0]
                print("\n📋 Sample Task Data Structure:")
                for key, value in sample_task.items():
                    print(f"   {key}: {value} (type: {type(value).__name__})")
                
                # Verify frontend-expected fields exist
                required_fields = ['id', 'task', 'category', 'day', 'status', 'task_type', 'image_required', 'video_required']
                missing_fields = [field for field in required_fields if field not in sample_task]
                
                if not missing_fields:
                    print("✅ All required frontend fields present!")
                else:
                    print(f"❌ Missing frontend fields: {missing_fields}")
                
        else:
            print(f"❌ Failed to retrieve tasks: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception during task retrieval: {e}")
    
    # Test 3: Test all category values
    print("\n3️⃣ Testing all category values...")
    categories = ["Cleaning", "Cutting", "Refilling", "Other"]
    for category in categories:
        try:
            test_data = {
                "task": f"Test {category} task",
                "category": category,
                "day": "monday",
                "task_type": "Daily",
                "image_required": False,
                "video_required": False
            }
            
            response = requests.post(f"{BASE_URL}/tasks", json=test_data)
            if response.status_code == 200:
                task = response.json()
                print(f"✅ {category}: Created successfully (ID: {task['id']})")
            else:
                print(f"❌ {category}: Failed ({response.status_code})")
                
        except Exception as e:
            print(f"❌ {category}: Exception - {e}")
    
    # Test 4: Test all day values  
    print("\n4️⃣ Testing all day values...")
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for day in days:
        try:
            test_data = {
                "task": f"Test {day} task",
                "category": "Cleaning",
                "day": day,
                "task_type": "Daily",
                "image_required": False,
                "video_required": False
            }
            
            response = requests.post(f"{BASE_URL}/tasks", json=test_data)
            if response.status_code == 200:
                task = response.json()
                print(f"✅ {day}: Created successfully (ID: {task['id']})")
            else:
                print(f"❌ {day}: Failed ({response.status_code})")
                
        except Exception as e:
            print(f"❌ {day}: Exception - {e}")

if __name__ == "__main__":
    test_frontend_data_format()
