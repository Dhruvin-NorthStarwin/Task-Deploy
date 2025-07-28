#!/usr/bin/env python3
"""
Railway Deployment Helper for Google Cloud Storage
"""
import json
import base64
import os

def encode_service_account_for_railway():
    """Convert service account JSON to base64 for Railway environment variable"""
    
    service_account_file = "service-account-key.json"
    
    if not os.path.exists(service_account_file):
        print(f"❌ Service account key not found: {service_account_file}")
        print("Please follow the setup guide first: python gcs_setup_guide.py")
        return None
    
    try:
        with open(service_account_file, 'r') as f:
            service_account_data = f.read()
        
        # Encode to base64
        encoded = base64.b64encode(service_account_data.encode()).decode()
        
        print("🚀 Railway Environment Variables:")
        print("=" * 50)
        print(f"GOOGLE_APPLICATION_CREDENTIALS_BASE64={encoded}")
        print("GCS_BUCKET_NAME=swift-terminal-462018-q7-task-storage")
        print("USE_CLOUD_STORAGE=true")
        print("GCS_BASE_URL=https://storage.googleapis.com")
        print()
        print("📝 Instructions:")
        print("1. Copy the GOOGLE_APPLICATION_CREDENTIALS_BASE64 value above")
        print("2. Go to your Railway project settings")
        print("3. Add each environment variable")
        print("4. Redeploy your application")
        
        return encoded
        
    except Exception as e:
        print(f"❌ Error encoding service account: {e}")
        return None

def create_railway_startup_script():
    """Create a startup script that decodes the base64 credentials for Railway"""
    
    script_content = '''#!/bin/bash
# Railway startup script for Google Cloud Storage

# Decode base64 credentials if provided
if [ ! -z "$GOOGLE_APPLICATION_CREDENTIALS_BASE64" ]; then
    echo "🔧 Setting up Google Cloud credentials..."
    echo "$GOOGLE_APPLICATION_CREDENTIALS_BASE64" | base64 -d > /tmp/service-account-key.json
    export GOOGLE_APPLICATION_CREDENTIALS=/tmp/service-account-key.json
    echo "✅ Google Cloud credentials configured"
fi

# Start the application
echo "🚀 Starting Task Module API..."
uvicorn main:app --host 0.0.0.0 --port $PORT
'''
    
    with open('start_railway.sh', 'w') as f:
        f.write(script_content)
    
    # Make it executable
    os.chmod('start_railway.sh', 0o755)
    
    print("✅ Created start_railway.sh")
    print("This script will automatically decode GCS credentials on Railway")

def update_dockerfile_for_gcs():
    """Update Dockerfile to include GCS dependencies"""
    
    dockerfile_content = '''FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/task_completions uploads/images uploads/videos

# Copy startup script
COPY start_railway.sh .
RUN chmod +x start_railway.sh

# Expose port
EXPOSE 8000

# Use the startup script
CMD ["./start_railway.sh"]
'''
    
    with open('Dockerfile.railway-gcs', 'w') as f:
        f.write(dockerfile_content)
    
    print("✅ Created Dockerfile.railway-gcs")
    print("Use this Dockerfile for Railway deployment with GCS support")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "encode":
        encode_service_account_for_railway()
    elif len(sys.argv) > 1 and sys.argv[1] == "docker":
        update_dockerfile_for_gcs()
    elif len(sys.argv) > 1 and sys.argv[1] == "startup":
        create_railway_startup_script()
    else:
        print("🚀 Railway Deployment Helper for Google Cloud Storage")
        print("=" * 55)
        print()
        print("Commands:")
        print("  python railway_gcs_helper.py encode   - Encode service account for Railway")
        print("  python railway_gcs_helper.py docker   - Create Railway Dockerfile")
        print("  python railway_gcs_helper.py startup  - Create startup script")
        print()
        encode_service_account_for_railway()
        create_railway_startup_script()
        update_dockerfile_for_gcs()
