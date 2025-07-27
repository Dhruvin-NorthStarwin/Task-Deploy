#!/usr/bin/env python3
"""
Development server runner for RestroManage Task Module Backend
"""

import subprocess
import sys
import os
from pathlib import Path

def run_backend_dev():
    """Run the backend development server"""
    # Change to backend directory
    backend_dir = Path(__file__).parent / "backend"
    
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        sys.exit(1)
    
    print("🚀 Starting RestroManage Task Module Backend...")
    print("📍 Backend directory:", backend_dir)
    print("🌐 API Documentation: http://localhost:8000/docs")
    print("❤️  Health Check: http://localhost:8000/health")
    print("📊 Admin Panel: http://localhost:5173")
    
    try:
        # Run the backend server
        os.chdir(backend_dir)
        subprocess.run([sys.executable, "run_dev.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_backend_dev()
