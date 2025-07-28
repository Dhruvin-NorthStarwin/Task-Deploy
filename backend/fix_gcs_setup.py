#!/usr/bin/env python3
"""
Google Cloud Storage Bucket Setup and Management
"""
import os
import json
import sys
from dotenv import load_dotenv

def check_service_account():
    """Check service account configuration"""
    print("🔍 Checking Service Account Configuration...")
    
    # Load service account file
    service_account_file = "service-account-key.json"
    if not os.path.exists(service_account_file):
        print("❌ Service account file not found")
        return False
    
    try:
        with open(service_account_file, 'r') as f:
            creds = json.load(f)
        
        project_id = creds.get('project_id')
        client_email = creds.get('client_email')
        
        print(f"✅ Service account found")
        print(f"📧 Email: {client_email}")
        print(f"📋 Project: {project_id}")
        
        return project_id
        
    except Exception as e:
        print(f"❌ Error reading service account: {e}")
        return False

def test_gcs_connection():
    """Test Google Cloud Storage connection"""
    print("\n🧪 Testing Google Cloud Storage Connection...")
    
    try:
        from google.cloud import storage
        from google.auth.exceptions import DefaultCredentialsError
        
        # Set credentials
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.path.abspath('service-account-key.json')
        
        client = storage.Client()
        project_id = client.project
        
        print(f"✅ Connected to project: {project_id}")
        
        return client, project_id
        
    except DefaultCredentialsError as e:
        print(f"❌ Authentication failed: {e}")
        return None, None
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None, None

def create_bucket_if_needed(client, project_id):
    """Create bucket if it doesn't exist"""
    print(f"\n📦 Bucket Management...")
    
    bucket_name = f"{project_id}-task-storage"
    print(f"Target bucket: {bucket_name}")
    
    try:
        # Check if bucket exists
        bucket = client.bucket(bucket_name)
        if bucket.exists():
            print(f"✅ Bucket already exists: {bucket_name}")
            print(f"📍 Location: {bucket.location}")
            print(f"💾 Storage Class: {bucket.storage_class}")
            return bucket_name
        else:
            print(f"📦 Bucket doesn't exist, attempting to create...")
            
            # Try to create bucket
            try:
                new_bucket = client.create_bucket(bucket_name, location="US")
                print(f"✅ Bucket created successfully: {bucket_name}")
                return bucket_name
            except Exception as create_error:
                print(f"❌ Failed to create bucket: {create_error}")
                if "billing" in str(create_error).lower():
                    print("💡 Billing account needs to be enabled for this project")
                    return suggest_alternative_solutions(project_id)
                else:
                    return suggest_alternative_solutions(project_id)
                    
    except Exception as e:
        print(f"❌ Bucket check failed: {e}")
        return suggest_alternative_solutions(project_id)

def suggest_alternative_solutions(project_id):
    """Suggest alternative solutions when bucket creation fails"""
    print(f"\n💡 Alternative Solutions:")
    print(f"=" * 40)
    
    print(f"1. 🌐 Manual Bucket Creation:")
    print(f"   • Go to: https://console.cloud.google.com/storage/browser?project={project_id}")
    print(f"   • Click 'Create Bucket'")
    print(f"   • Name: {project_id}-task-storage")
    print(f"   • Location: us-central1 (or your preferred region)")
    print(f"   • Storage Class: Standard")
    print(f"   • Enable billing if prompted")
    
    print(f"\n2. 💳 Enable Billing:")
    print(f"   • Go to: https://console.cloud.google.com/billing/linkedaccount?project={project_id}")
    print(f"   • Link a billing account")
    print(f"   • Google Cloud offers $300 free credit for new accounts")
    
    print(f"\n3. 🏠 Use Local Storage (Current Setup):")
    print(f"   • Files stored in ./uploads directory")
    print(f"   • Works for development and small deployments")
    print(f"   • No additional costs")
    
    print(f"\n4. 🔄 Hybrid Approach:")
    print(f"   • Development: Local storage")
    print(f"   • Production: Google Cloud Storage")
    print(f"   • Switch via USE_CLOUD_STORAGE environment variable")
    
    return None

def update_configuration(bucket_name=None):
    """Update configuration based on results"""
    print(f"\n🔧 Configuration Update:")
    
    if bucket_name:
        # Update .env for cloud storage
        env_content = f"""# Google Cloud Storage Configuration
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GCS_BUCKET_NAME={bucket_name}
USE_CLOUD_STORAGE=true
GCS_BASE_URL=https://storage.googleapis.com

# Database Configuration
DATABASE_URL=sqlite:///./restro_manage.db
SECRET_KEY=your-secret-key-change-in-production

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://task-module.up.railway.app,https://radiant-amazement-production-d68f.up.railway.app

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIRECTORY=./uploads

# Development Settings
DEBUG=true
LOG_LEVEL=INFO
ENVIRONMENT=development
"""
        with open('.env', 'w') as f:
            f.write(env_content)
        print(f"✅ Updated .env for cloud storage with bucket: {bucket_name}")
        
    else:
        # Keep local storage configuration
        print(f"ℹ️  Keeping local storage configuration")
        print(f"📁 Files will be stored in: ./uploads")
        print(f"🌐 URLs will be: http://localhost:8000/uploads/...")
    
    print(f"\n🚀 Next Steps:")
    if bucket_name:
        print(f"   1. Test uploads via /api/upload/image or /api/upload/video")
        print(f"   2. Check admin storage status: /api/admin/storage/status")
        print(f"   3. Files will be accessible via GCS URLs")
    else:
        print(f"   1. Enable billing and create bucket manually")
        print(f"   2. Or continue with local storage for now")
        print(f"   3. Switch to cloud storage when ready")

def main():
    """Main setup function"""
    print("🚀 Google Cloud Storage Setup & Troubleshooting")
    print("=" * 50)
    
    # Load environment
    load_dotenv()
    
    # Check service account
    project_id = check_service_account()
    if not project_id:
        print("❌ Setup failed - service account issues")
        return
    
    # Test connection
    client, connected_project = test_gcs_connection()
    if not client:
        print("❌ Setup failed - connection issues")
        suggest_alternative_solutions(project_id)
        return
    
    # Create bucket
    bucket_name = create_bucket_if_needed(client, connected_project)
    
    # Update configuration
    update_configuration(bucket_name)
    
    print(f"\n🎉 Setup Complete!")

if __name__ == "__main__":
    main()
