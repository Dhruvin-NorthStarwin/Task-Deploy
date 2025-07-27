#!/usr/bin/env python3
"""
Comprehensive test script for task operations
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def log_test(test_name, success, details=""):
    status = "✅" if success else "❌"
    print(f"{status} {test_name}")
    if details:
        print(f"   {details}")

def test_create_task():
    """Test task creation with various categories and days"""
    test_cases = [
        {
            "task": "Clean kitchen surfaces",
            "description": "Wipe down all counters and surfaces",
            "category": "Cleaning",
            "day": "monday",
            "task_type": "Daily",
            "image_required": True,
            "video_required": False
        },
        {
            "task": "Cut vegetables for prep",
            "description": "Prepare vegetables for today's menu",
            "category": "Cutting",
            "day": "tuesday",
            "task_type": "Daily",
            "image_required": False,
            "video_required": True
        },
        {
            "task": "Refill salt and pepper",
            "description": "Check and refill all table condiments",
            "category": "Refilling",
            "day": "wednesday",
            "task_type": "Priority",
            "image_required": False,
            "video_required": False
        },
        {
            "task": "Special cleaning task",
            "description": "Deep clean the storage area",
            "category": "Other",
            "day": "friday",
            "task_type": "Priority",
            "image_required": True,
            "video_required": True
        }
    ]
    
    created_tasks = []
    
    for i, task_data in enumerate(test_cases):
        try:
            response = requests.post(f"{BASE_URL}/tasks", json=task_data)
            if response.status_code == 200:
                task = response.json()
                created_tasks.append(task)
                log_test(f"Create Task {i+1} ({task_data['category']})", True, 
                        f"Created task ID: {task['id']}")
            else:
                log_test(f"Create Task {i+1} ({task_data['category']})", False, 
                        f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            log_test(f"Create Task {i+1} ({task_data['category']})", False, str(e))
    
    return created_tasks

def test_get_tasks():
    """Test task retrieval"""
    try:
        response = requests.get(f"{BASE_URL}/tasks")
        if response.status_code == 200:
            tasks = response.json()
            log_test("Get All Tasks", True, f"Retrieved {len(tasks)} tasks")
            return tasks
        else:
            log_test("Get All Tasks", False, f"Status: {response.status_code}, Error: {response.text}")
            return []
    except Exception as e:
        log_test("Get All Tasks", False, str(e))
        return []

def test_get_tasks_with_filters():
    """Test task retrieval with filters"""
    filters = [
        {"category": "Cleaning"},
        {"day": "monday"},
        {"task_type": "Daily"},
        {"status": "Unknown"}
    ]
    
    for filter_data in filters:
        try:
            params = "&".join([f"{k}={v}" for k, v in filter_data.items()])
            response = requests.get(f"{BASE_URL}/tasks?{params}")
            if response.status_code == 200:
                tasks = response.json()
                filter_str = ", ".join([f"{k}={v}" for k, v in filter_data.items()])
                log_test(f"Get Tasks with Filter ({filter_str})", True, 
                        f"Retrieved {len(tasks)} tasks")
            else:
                log_test(f"Get Tasks with Filter ({filter_str})", False, 
                        f"Status: {response.status_code}")
        except Exception as e:
            log_test(f"Get Tasks with Filter ({filter_str})", False, str(e))

def test_update_task(task_id):
    """Test task update"""
    update_data = {
        "status": "Done",
        "initials": "JD"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data)
        if response.status_code == 200:
            task = response.json()
            log_test(f"Update Task {task_id}", True, 
                    f"Status: {task['status']}, Initials: {task['initials']}")
            return task
        else:
            log_test(f"Update Task {task_id}", False, 
                    f"Status: {response.status_code}, Error: {response.text}")
            return None
    except Exception as e:
        log_test(f"Update Task {task_id}", False, str(e))
        return None

def test_decline_task(task_id):
    """Test task decline"""
    decline_data = {
        "reason": "Task is not applicable today"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/tasks/{task_id}/decline", json=decline_data)
        if response.status_code == 200:
            task = response.json()
            log_test(f"Decline Task {task_id}", True, 
                    f"Status: {task['status']}, Reason: {task['decline_reason']}")
            return task
        else:
            log_test(f"Decline Task {task_id}", False, 
                    f"Status: {response.status_code}, Error: {response.text}")
            return None
    except Exception as e:
        log_test(f"Decline Task {task_id}", False, str(e))
        return None

def main():
    print("🧪 Starting Comprehensive Task API Tests")
    print("=" * 50)
    
    # Test 1: Create tasks
    print("\n📝 Testing Task Creation...")
    created_tasks = test_create_task()
    
    # Test 2: Get all tasks
    print("\n📋 Testing Task Retrieval...")
    all_tasks = test_get_tasks()
    
    # Test 3: Get tasks with filters
    print("\n🔍 Testing Filtered Task Retrieval...")
    test_get_tasks_with_filters()
    
    # Test 4: Update task (if we have tasks)
    if created_tasks:
        print("\n✏️ Testing Task Updates...")
        test_update_task(created_tasks[0]['id'])
        
        # Test 5: Decline task (if we have multiple tasks)
        if len(created_tasks) > 1:
            print("\n❌ Testing Task Decline...")
            test_decline_task(created_tasks[1]['id'])
    
    # Final verification
    print("\n🔍 Final Verification - Get All Tasks...")
    final_tasks = test_get_tasks()
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print(f"   📊 Total tasks created: {len(created_tasks)}")
    print(f"   📋 Total tasks in system: {len(final_tasks)}")
    
    if final_tasks:
        print("\n📋 Current Tasks:")
        for task in final_tasks:
            print(f"   • ID: {task['id']}, Task: {task['task']}, Category: {task['category']}, Status: {task['status']}")

if __name__ == "__main__":
    main()
