#!/usr/bin/env python3
"""
Google Cloud Storage Setup Script for Task Module
"""
import os
import json
import sys
from google.cloud import storage
from google.auth.exceptions import DefaultCredentialsError

def setup_gcs():
    """Setup Google Cloud Storage for the task module"""
    print("🚀 Setting up Google Cloud Storage for Task Module...")
    
    # Check if credentials file exists
    credentials_file = "client_secret_690205392308-03pp7kance0fk55q5bqihmj8nbfe6rjs.apps.googleusercontent.com.json"
    
    if not os.path.exists(credentials_file):
        print(f"❌ Credentials file not found: {credentials_file}")
        print("Please ensure the credentials file is in the backend directory")
        return False
    
    try:
        # Load credentials
        with open(credentials_file, 'r') as f:
            creds = json.load(f)
        
        project_id = creds.get('installed', {}).get('project_id')
        if not project_id:
            print("❌ Project ID not found in credentials file")
            return False
        
        print(f"📋 Project ID: {project_id}")
        
        # Set environment variable
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.path.abspath(credentials_file)
        
        # Test connection
        client = storage.Client()
        print(f"✅ Successfully connected to Google Cloud Storage")
        
        # Create bucket if it doesn't exist
        bucket_name = f"{project_id}-task-module-storage"
        
        try:
            bucket = client.bucket(bucket_name)
            if not bucket.exists():
                print(f"📦 Creating bucket: {bucket_name}")
                bucket = client.create_bucket(bucket_name, location="US")
                print(f"✅ Bucket created successfully")
            else:
                print(f"✅ Bucket already exists: {bucket_name}")
        except Exception as e:
            print(f"⚠️ Bucket operation failed: {e}")
            print("Using existing bucket or will create on first upload")
        
        # Print environment variables to set
        print("\n🔧 Environment Variables to Set:")
        print(f"GOOGLE_APPLICATION_CREDENTIALS={os.path.abspath(credentials_file)}")
        print(f"GCS_BUCKET_NAME={bucket_name}")
        print("USE_CLOUD_STORAGE=true")
        
        # Create .env file for local development
        env_content = f"""# Google Cloud Storage Configuration
GOOGLE_APPLICATION_CREDENTIALS={os.path.abspath(credentials_file)}
GCS_BUCKET_NAME={bucket_name}
USE_CLOUD_STORAGE=true
GCS_BASE_URL=https://storage.googleapis.com

# Existing configuration (update as needed)
DATABASE_URL=sqlite:///./restro_manage.db
SECRET_KEY=your-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
"""
        
        with open('.env', 'w') as f:
            f.write(env_content)
        
        print(f"✅ Created .env file with GCS configuration")
        
        return True
        
    except DefaultCredentialsError:
        print("❌ Invalid credentials or authentication failed")
        return False
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        return False

def test_gcs():
    """Test Google Cloud Storage functionality"""
    try:
        from app.services.file_service import file_service
        
        print("🧪 Testing file service...")
        
        if file_service.use_cloud_storage:
            print("✅ Cloud storage is enabled")
            print(f"📦 Bucket: {file_service.gcs_bucket_name}")
        else:
            print("⚠️ Cloud storage is disabled, using local storage")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    print("Google Cloud Storage Setup for Task Module")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_gcs()
    else:
        setup_gcs()
