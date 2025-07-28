from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)

class PreflightMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Handle preflight requests
        if request.method == "OPTIONS":
            logger.info(f"Handling preflight request from origin: {request.headers.get('origin')}")
            
            # Create a custom response with CORS headers
            response = Response(
                content="",
                status_code=200
            )
            
            # Reflect the origin header
            origin = request.headers.get("origin", "*")
            response.headers["Access-Control-Allow-Origin"] = origin
            
            # Allow all common headers and methods
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Pragma"
            response.headers["Access-Control-Max-Age"] = "600"  # Cache preflight for 10 minutes
            
            return response
            
        # For non-OPTIONS requests, pass through to the normal flow
        return await call_next(request)
