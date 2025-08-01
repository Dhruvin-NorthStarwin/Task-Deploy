// API Endpoints Documentation - VERIFIED against backend routers
// This file documents all the ACTUAL API endpoints from the backend

import config from '../config/environment';

// Debug: Log config at module load time
console.log('🔍 Config at module load:', config);
console.log('🔍 API_BASE_URL:', config?.API_BASE_URL);

// Fallback API base URL in case config fails
const API_BASE_URL = config?.API_BASE_URL || '/api';

export const API_ENDPOINTS = {
  // Base URL - should be https://radiant-amazement-production-d68f.up.railway.app/api
  BASE_URL: API_BASE_URL,
  
  // Authentication endpoints (from auth.py)
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,          // POST - Register new restaurant
    LOGIN: `${API_BASE_URL}/auth/login`,                // POST - Login restaurant
    VALIDATE_PIN: `${API_BASE_URL}/auth/validate-pin`,  // POST - Validate user PIN
    LOGOUT: `${API_BASE_URL}/auth/logout`,              // POST - Logout
  },
  
  // Task management endpoints (from tasks.py)
  TASKS: {
    LIST: `${API_BASE_URL}/tasks/`,                     // GET - Get all tasks (with filters)
    CREATE: `${API_BASE_URL}/tasks/`,                   // POST - Create new task
    GET_BY_ID: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}`,        // GET - Get task by ID
    UPDATE: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}`,           // PUT - Update task
    DELETE: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}`,           // DELETE - Delete task
    SUBMIT: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/submit`,    // PATCH - Submit task
    APPROVE: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/approve`,  // PATCH - Approve task
    DECLINE: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/decline`,  // PATCH - Decline task
    GET_MEDIA: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/media`,  // GET - Get task media
  },
  
  // User management endpoints (from users.py)
  USERS: {
    LIST: `${API_BASE_URL}/users/`,                     // GET - Get all users
    CREATE: `${API_BASE_URL}/users/`,                   // POST - Create new user
    GET_BY_ID: (userId: string) => `${API_BASE_URL}/users/${userId}`,        // GET - Get user by ID
    UPDATE: (userId: string) => `${API_BASE_URL}/users/${userId}`,           // PUT - Update user
    DELETE: (userId: string) => `${API_BASE_URL}/users/${userId}`,           // DELETE - Delete user
  },
  
  // File upload endpoints (from uploads.py - prefix: /upload)
  UPLOADS: {
    IMAGE: `${API_BASE_URL}/upload/image`,              // POST - Upload image
    VIDEO: `${API_BASE_URL}/upload/video`,              // POST - Upload video
    SERVE: (taskId: string, filename: string) => `${API_BASE_URL}/upload/serve/${taskId}/${filename}`, // GET - Serve uploaded file
    DELETE_MEDIA: (mediaId: string) => `${API_BASE_URL}/upload/media/${mediaId}`, // DELETE - Delete media
  },
  
  // Health and debug endpoints (from health.py)
  HEALTH: {
    CHECK: `${API_BASE_URL}/health`,                    // GET - Health check
    READINESS: `${API_BASE_URL}/readiness`,             // GET - Readiness check
    METRICS: `${API_BASE_URL}/metrics`,                 // GET - System metrics
    CORS_DEBUG: `${API_BASE_URL}/cors-debug`,           // GET - CORS debug info
  },
  
  // Static file serving (uploads) - mounted at root level
  STATIC: {
    UPLOADS: `${API_BASE_URL.replace('/api', '')}/uploads`, // Static files served from /uploads
  },
  
  // NFC endpoints (from nfc.py)
  NFC: {
    CLEAN: (restaurantCode: string, assetId: string) => `${API_BASE_URL}/nfc/clean/${restaurantCode}/${assetId}`,     // POST - Complete cleaning task via NFC
    LOGS: (assetId: string) => `${API_BASE_URL}/nfc/clean/${assetId}/logs`, // GET - Get cleaning logs for asset
    ASSETS: (restaurantId: string) => `${API_BASE_URL}/nfc/assets/${restaurantId}`, // GET - Get NFC assets for restaurant
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
