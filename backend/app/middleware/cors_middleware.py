from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from typing import List, Dict, Any
import os
from app.config import settings

class CustomCORSMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        
        # Get allowed origins from settings
        self.allowed_origins = settings.ALLOWED_ORIGINS
        
        # Special case to ensure Railway frontend works
        if isinstance(self.allowed_origins, list) and "https://task-module.up.railway.app" not in self.allowed_origins:
            self.allowed_origins.append("https://task-module.up.railway.app")
        
        # Wildcard handling
        self.use_wildcard = False
        if self.allowed_origins == "*" or self.allowed_origins == ["*"]:
            self.use_wildcard = True
    
    async def dispatch(self, request: Request, call_next):
        # Handle preflight OPTIONS requests immediately
        if request.method == "OPTIONS":
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = request.headers.get("origin", "*")
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept, Upgrade-Insecure-Requests"
            response.headers["Access-Control-Max-Age"] = "86400"  # 24 hours
            return response
        
        # Get the origin from the request
        origin = request.headers.get("origin", "")
        
        # Call the next middleware/route
        response = await call_next(request)
        
        # Set CORS headers without modifying Content-Length
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"
            
        # Set other CORS headers
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept, Upgrade-Insecure-Requests"
        
        # Add iOS-specific headers without modifying content
        response.headers["Access-Control-Expose-Headers"] = "Content-Length, X-JSON"
        response.headers["Vary"] = "Origin"
        
        # Security headers for iOS Safari
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Handle OPTIONS preflight requests
        if request.method == "OPTIONS":
            # Set additional headers for preflight
            response.headers["Access-Control-Max-Age"] = "600"  # Cache preflight for 10 minutes
            
            # Return early with 200 OK for OPTIONS
            return Response(
                content="",
                status_code=200,
                headers=dict(response.headers)
            )
        
        return response
