#!/usr/bin/env python3
"""
Debug script for configuration
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings

def debug_config():
    """Debug configuration values"""
    
    print("🔍 Configuration Debug...")
    print(f"CLOUDINARY_CLOUD_NAME: {settings.CLOUDINARY_CLOUD_NAME}")
    print(f"CLOUDINARY_API_KEY: {settings.CLOUDINARY_API_KEY}")  
    print(f"CLOUDINARY_API_SECRET: {settings.CLOUDINARY_API_SECRET}")
    print(f"USE_CLOUD_STORAGE: {settings.USE_CLOUD_STORAGE}")
    print(f"ENVIRONMENT: {settings.ENVIRONMENT}")
    
    # Check for .env file
    env_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    print(f"\n📄 .env file path: {env_file_path}")
    print(f".env file exists: {os.path.exists(env_file_path)}")
    
    if os.path.exists(env_file_path):
        print("\n📄 .env file contents:")
        with open(env_file_path, 'r') as f:
            content = f.read()
            # Hide sensitive values
            lines = content.split('\n')
            for line in lines:
                if line.strip() and not line.startswith('#'):
                    if 'SECRET' in line.upper() or 'PASSWORD' in line.upper():
                        print(f"{line.split('=')[0]}=***hidden***")
                    else:
                        print(line)

if __name__ == "__main__":
    debug_config()
