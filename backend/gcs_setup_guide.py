#!/usr/bin/env python3
"""
Google Cloud Storage Setup Guide for Task Module
"""
import os
import json

def print_setup_instructions():
    """Print detailed setup instructions for Google Cloud Storage"""
    
    print("""
🚀 Google Cloud Storage Setup Guide for Task Module
====================================================

You currently have OAuth 2.0 client credentials, but for a server application 
like your task module, you need a Service Account key.

📋 Steps to Create a Service Account:

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Select your project: swift-terminal-462018-q7
3. Navigate to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
5. Fill in the details:
   - Name: task-module-storage
   - Description: Service account for task module file storage
6. Click "Create and Continue"
7. Add these roles:
   - Storage Admin (for full bucket access)
   - Storage Object Admin (for file operations)
8. Click "Continue" and then "Done"
9. Click on the created service account
10. Go to "Keys" tab
11. Click "Add Key" > "Create new key"
12. Select "JSON" format
13. Download the JSON file

📝 File Setup:
- Save the downloaded JSON file as: service-account-key.json
- Place it in the backend directory: p:\\task-module--master\\backend\\

🔧 Environment Variables:
After creating the service account, set these environment variables:

For Local Development (.env file):
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GCS_BUCKET_NAME=swift-terminal-462018-q7-task-storage
USE_CLOUD_STORAGE=true
GCS_BASE_URL=https://storage.googleapis.com

For Railway Deployment:
GOOGLE_APPLICATION_CREDENTIALS=<base64-encoded-service-account-json>
GCS_BUCKET_NAME=swift-terminal-462018-q7-task-storage
USE_CLOUD_STORAGE=true
GCS_BASE_URL=https://storage.googleapis.com

📦 Bucket Creation:
The bucket will be automatically created when you first upload a file,
or you can create it manually in the Google Cloud Console:
- Go to "Storage" > "Buckets"
- Click "Create Bucket"
- Name: swift-terminal-462018-q7-task-storage
- Location: us-central1 (or your preferred region)
- Storage class: Standard

🔐 Permissions:
Make sure your service account has these permissions:
- storage.buckets.create
- storage.buckets.get
- storage.objects.create
- storage.objects.delete
- storage.objects.get
- storage.objects.list

🚀 Testing:
After setup, run: python setup_gcs.py test

""")

def create_env_template():
    """Create environment template"""
    env_content = """# Google Cloud Storage Configuration
# Replace with your actual service account key path
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GCS_BUCKET_NAME=swift-terminal-462018-q7-task-storage
USE_CLOUD_STORAGE=true
GCS_BASE_URL=https://storage.googleapis.com

# Existing configuration
DATABASE_URL=sqlite:///./restro_manage.db
SECRET_KEY=your-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://task-module.up.railway.app
"""
    
    with open('.env.template', 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env.template - copy to .env and update with your values")

def check_service_account():
    """Check if service account key exists and is valid"""
    service_account_file = "service-account-key.json"
    
    if not os.path.exists(service_account_file):
        print(f"❌ Service account key not found: {service_account_file}")
        print("Please follow the setup instructions above to create one.")
        return False
    
    try:
        with open(service_account_file, 'r') as f:
            creds = json.load(f)
        
        required_fields = ['type', 'project_id', 'private_key', 'client_email']
        for field in required_fields:
            if field not in creds:
                print(f"❌ Invalid service account key: missing {field}")
                return False
        
        if creds.get('type') != 'service_account':
            print(f"❌ Invalid credential type: {creds.get('type')} (expected: service_account)")
            return False
        
        print(f"✅ Valid service account key found")
        print(f"📧 Service account email: {creds.get('client_email')}")
        print(f"📋 Project ID: {creds.get('project_id')}")
        
        return True
        
    except json.JSONDecodeError:
        print("❌ Invalid JSON in service account key file")
        return False
    except Exception as e:
        print(f"❌ Error reading service account key: {e}")
        return False

def test_gcs_setup():
    """Test Google Cloud Storage setup"""
    if not check_service_account():
        return False
    
    try:
        # Set environment variable
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.path.abspath('service-account-key.json')
        
        from google.cloud import storage
        from google.auth.exceptions import DefaultCredentialsError
        
        # Test connection
        client = storage.Client()
        project_id = client.project
        
        print(f"✅ Successfully connected to Google Cloud Storage")
        print(f"📋 Project: {project_id}")
        
        # Test bucket access
        bucket_name = f"{project_id}-task-storage"
        
        try:
            bucket = client.bucket(bucket_name)
            if bucket.exists():
                print(f"✅ Bucket exists: {bucket_name}")
            else:
                print(f"📦 Creating bucket: {bucket_name}")
                bucket = client.create_bucket(bucket_name, location="US")
                print(f"✅ Bucket created successfully")
        except Exception as e:
            print(f"⚠️ Bucket operation warning: {e}")
        
        print("\n🎉 Google Cloud Storage is ready!")
        return True
        
    except DefaultCredentialsError:
        print("❌ Authentication failed - check your service account key")
        return False
    except Exception as e:
        print(f"❌ Setup test failed: {e}")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        print("🧪 Testing Google Cloud Storage setup...")
        test_gcs_setup()
    elif len(sys.argv) > 1 and sys.argv[1] == "check":
        check_service_account()
    else:
        print_setup_instructions()
        create_env_template()
