from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import traceback
from app.config import settings

logger = logging.getLogger(__name__)

async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for all unhandled exceptions"""
    
    # Log the exception
    logger.error(f"Global exception on {request.method} {request.url}: {exc}", exc_info=True)
    
    # Handle different types of exceptions
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "type": "http_exception"}
        )
    
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation error",
                "errors": exc.errors(),
                "type": "validation_error"
            }
        )
    
    # For unknown exceptions, return different responses based on environment
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "error": str(exc),
                "traceback": traceback.format_exc().split('\n'),
                "type": "internal_error"
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "type": "internal_error"
            }
        )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with more detailed response"""
    
    logger.warning(f"Validation error on {request.method} {request.url}: {exc.errors()}")
    
    # Format validation errors nicely
    errors = []
    for error in exc.errors():
        field_path = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field_path,
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation failed",
            "errors": errors,
            "type": "validation_error"
        }
    )
