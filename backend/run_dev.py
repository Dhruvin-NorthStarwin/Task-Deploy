#!/usr/bin/env python3
"""
Development server runner for RestroManage Task Module Backend
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def run_dev_server():
    """Run the development server"""
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["app"],
        log_level="info"
    )

if __name__ == "__main__":
    print("Starting RestroManage Task Module Backend...")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    run_dev_server()
