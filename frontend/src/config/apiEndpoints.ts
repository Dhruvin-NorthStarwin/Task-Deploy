// API Endpoints Documentation - VERIFIED against backend routers
// This file documents all the ACTUAL API endpoints from the backend

import config from '../config/environment';

export const API_ENDPOINTS = {
  // Base URL - should be https://radiant-amazement-production-d68f.up.railway.app/api
  BASE_URL: config.API_BASE_URL,
  
  // Authentication endpoints (from auth.py)
  AUTH: {
    REGISTER: `${config.API_BASE_URL}/auth/register`,          // POST - Register new restaurant
    LOGIN: `${config.API_BASE_URL}/auth/login`,                // POST - Login restaurant
    VALIDATE_PIN: `${config.API_BASE_URL}/auth/validate-pin`,  // POST - Validate user PIN
    LOGOUT: `${config.API_BASE_URL}/auth/logout`,              // POST - Logout
  },
  
  // Task management endpoints (from tasks.py)
  TASKS: {
    LIST: `${config.API_BASE_URL}/tasks/`,                     // GET - Get all tasks (with filters)
    CREATE: `${config.API_BASE_URL}/tasks/`,                   // POST - Create new task
    GET_BY_ID: (taskId: string) => `${config.API_BASE_URL}/tasks/${taskId}`,        // GET - Get task by ID
    UPDATE: (taskId: string) => `${config.API_BASE_URL}/tasks/${taskId}`,           // PUT - Update task
    DELETE: (taskId: string) => `${config.API_BASE_URL}/tasks/${taskId}`,           // DELETE - Delete task
    SUBMIT: (taskId: string) => `${config.API_BASE_URL}/tasks/${taskId}/submit`,    // PATCH - Submit task
    APPROVE: (taskId: string) => `${config.API_BASE_URL}/tasks/${taskId}/approve`,  // PATCH - Approve task
    DECLINE: (taskId: string) => `${config.API_BASE_URL}/tasks/${taskId}/decline`,  // PATCH - Decline task
    GET_MEDIA: (taskId: string) => `${config.API_BASE_URL}/tasks/${taskId}/media`,  // GET - Get task media
  },
  
  // User management endpoints (from users.py)
  USERS: {
    LIST: `${config.API_BASE_URL}/users/`,                     // GET - Get all users
    CREATE: `${config.API_BASE_URL}/users/`,                   // POST - Create new user
    GET_BY_ID: (userId: string) => `${config.API_BASE_URL}/users/${userId}`,        // GET - Get user by ID
    UPDATE: (userId: string) => `${config.API_BASE_URL}/users/${userId}`,           // PUT - Update user
    DELETE: (userId: string) => `${config.API_BASE_URL}/users/${userId}`,           // DELETE - Delete user
  },
  
  // File upload endpoints (from uploads.py - prefix: /upload)
  UPLOADS: {
    IMAGE: `${config.API_BASE_URL}/upload/image`,              // POST - Upload image
    VIDEO: `${config.API_BASE_URL}/upload/video`,              // POST - Upload video
    SERVE: (taskId: string, filename: string) => `${config.API_BASE_URL}/upload/serve/${taskId}/${filename}`, // GET - Serve uploaded file
    DELETE_MEDIA: (mediaId: string) => `${config.API_BASE_URL}/upload/media/${mediaId}`, // DELETE - Delete media
  },
  
  // Health and debug endpoints (from health.py)
  HEALTH: {
    CHECK: `${config.API_BASE_URL}/health`,                    // GET - Health check
    READINESS: `${config.API_BASE_URL}/readiness`,             // GET - Readiness check
    METRICS: `${config.API_BASE_URL}/metrics`,                 // GET - System metrics
    CORS_DEBUG: `${config.API_BASE_URL}/cors-debug`,           // GET - CORS debug info
  },
  
  // Static file serving (uploads) - mounted at root level
  STATIC: {
    UPLOADS: `${config.API_BASE_URL.replace('/api', '')}/uploads`, // Static files served from /uploads
  },
  
  // NFC endpoints (from nfc.py)
  NFC: {
    CLEAN: (assetId: string) => `${config.API_BASE_URL}/nfc/clean/${assetId}`,     // POST - Complete cleaning task via NFC
    LOGS: (assetId: string) => `${config.API_BASE_URL}/nfc/clean/${assetId}/logs`, // GET - Get cleaning logs for asset
    ASSETS: (restaurantId: string) => `${config.API_BASE_URL}/nfc/assets/${restaurantId}`, // GET - Get NFC assets for restaurant
  },
};

// Debug function to log all endpoints
export const debugEndpoints = () => {
  console.log('🔍 VERIFIED API Endpoints Configuration:');
  console.log('Base URL:', API_ENDPOINTS.BASE_URL);
  console.log('🔐 Auth endpoints:', API_ENDPOINTS.AUTH);
  console.log('📋 Task endpoints:', API_ENDPOINTS.TASKS);
  console.log('👥 User endpoints:', API_ENDPOINTS.USERS);
  console.log('📁 Upload endpoints:', API_ENDPOINTS.UPLOADS);
  console.log('🏥 Health endpoints:', API_ENDPOINTS.HEALTH);
  console.log('📊 Static endpoints:', API_ENDPOINTS.STATIC);
  console.log('📱 NFC endpoints:', API_ENDPOINTS.NFC);
};

export default API_ENDPOINTS;
