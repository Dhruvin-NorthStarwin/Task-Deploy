// Hardcoded production URLs for Railway deployment
const PRODUCTION_FRONTEND_URL = 'https://task-module.up.railway.app';
const PRODUCTION_BACKEND_URL = 'https://radiant-amazement-production-d68f.up.railway.app/api';
const LOCALHOST_BACKEND_URL = 'http://localhost:8000/api';

// Get the API URL with proper fallback logic
const getApiUrl = (isDebug: boolean) => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const isDev = import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.PROD;
  
  // Check if we're running on the production frontend domain
  const isProductionDomain = window.location.origin === PRODUCTION_FRONTEND_URL;
  
  // Detect iOS for forced HTTPS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // HARDCODED: If we're on production domain, always use production backend
  if (isProductionDomain || isProduction) {
    if (isDebug) {
      console.log('🚀 HARDCODED: Production domain detected, using Railway backend');
      console.log('🔗 Frontend:', window.location.origin);
      console.log('🔗 Backend:', PRODUCTION_BACKEND_URL);
    }
    return PRODUCTION_BACKEND_URL;
  }
  
  // HARDCODED: If we're in development, use localhost
  if (isDev && !isProductionDomain) {
    if (isDebug) {
      console.log('🛠️ HARDCODED: Development mode, using localhost backend');
      console.log('🔗 Frontend:', window.location.origin);
      console.log('🔗 Backend:', LOCALHOST_BACKEND_URL);
    }
    return LOCALHOST_BACKEND_URL;
  }
  
  // Fallback to env variable if set
  if (envUrl) {
    let finalUrl = envUrl;
    
    // Force HTTPS for Railway deployments
    if (envUrl.includes('radiant-amazement-production-d68f.up.railway.app')) {
      finalUrl = envUrl.replace('http://', 'https://');
    }
    
    // Force HTTPS for iOS devices
    if (isIOS && finalUrl.startsWith('http://')) {
      finalUrl = finalUrl.replace('http://', 'https://');
      console.log('🍎 iOS: Forced HTTPS for iOS device:', finalUrl);
    }
    
    // Ensure the URL ends with /api for backend endpoints
    if (!finalUrl.endsWith('/api') && !finalUrl.endsWith('/api/')) {
      finalUrl = finalUrl.endsWith('/') ? finalUrl + 'api' : finalUrl + '/api';
    }
    
    if (isDebug) {
      console.log('🔧 Using env variable URL:', finalUrl);
    }
    return finalUrl;
  }

  // Final fallback
  return isDev ? LOCALHOST_BACKEND_URL : PRODUCTION_BACKEND_URL;
};

// Environment configuration for different deployment stages
const isDebugMode = import.meta.env.VITE_DEBUG === 'true';

export const config = {
  API_BASE_URL: getApiUrl(isDebugMode),
  UPLOAD_MAX_SIZE: parseInt(import.meta.env.VITE_UPLOAD_MAX_SIZE || '10485760'), // 10MB
  ENVIRONMENT: import.meta.env.MODE || 'development',
  DEBUG: isDebugMode,
  REQUEST_TIMEOUT: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '20000'), // Increased to 20 seconds for iOS
};

// Debug: Log the API URL being used (only in debug mode)
if (config.DEBUG) {
  console.log('🔍 API_BASE_URL:', config.API_BASE_URL);
  console.log('🔍 Environment Mode:', config.ENVIRONMENT);
  console.log('🔍 VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);
}

// Validate required environment variables in production
if (config.ENVIRONMENT === 'production') {
  if (!import.meta.env.VITE_API_BASE_URL && config.DEBUG) {
    console.warn(`⚠️ Environment variable VITE_API_BASE_URL not set, using fallback value`);
  }
}

export default config;
