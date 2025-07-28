// Get the API URL with proper fallback logic
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const isDev = import.meta.env.MODE === 'development';
  
  // Detect iOS for forced HTTPS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Force HTTPS for specific known Railway deployments
  if (envUrl && envUrl.includes('radiant-amazement-production-d68f.up.railway.app')) {
    let httpsUrl = envUrl.replace('http://', 'https://');
    
    // Ensure the URL ends with /api for backend endpoints
    if (!httpsUrl.endsWith('/api') && !httpsUrl.endsWith('/api/')) {
      httpsUrl = httpsUrl.endsWith('/') ? httpsUrl + 'api' : httpsUrl + '/api';
    }
    
    if (config.DEBUG) {
      console.log('🔒 Ensuring HTTPS and /api path for Railway backend:', httpsUrl);
    }
    return httpsUrl;
  }
  
  // Force HTTPS for iOS devices in production
  if (!isDev && isIOS && envUrl && envUrl.startsWith('http://')) {
    const httpsUrl = envUrl.replace('http://', 'https://');
    console.log('🍎 iOS: Forced HTTPS for iOS device:', httpsUrl);
    return httpsUrl;
  }
  
  // In development, use localhost (can be switched to HTTPS if needed)
  if (isDev && !envUrl) {
    return 'http://localhost:8000/api';
  }

  // In production, always use HTTPS for Railway fallback
  if (!isDev && !envUrl) {
    if (config.DEBUG) {
      console.log('🚀 Using production Railway HTTPS URL');
    }
    return 'https://radiant-amazement-production-d68f.up.railway.app/api';
  }
  
  // If we have an envUrl but we're in production, ensure it's HTTPS and has /api
  if (!isDev && envUrl) {
    let finalUrl = envUrl.startsWith('http://') ? envUrl.replace('http://', 'https://') : envUrl;
    
    // Ensure the URL ends with /api for backend endpoints
    if (!finalUrl.endsWith('/api') && !finalUrl.endsWith('/api/')) {
      finalUrl = finalUrl.endsWith('/') ? finalUrl + 'api' : finalUrl + '/api';
    }
    
    if (config.DEBUG) {
      console.log('🔒 Final API URL for production:', finalUrl);
    }
    return finalUrl;
  }

  return envUrl;
};// Environment configuration for different deployment stages
export const config = {
  API_BASE_URL: getApiUrl(),
  UPLOAD_MAX_SIZE: parseInt(import.meta.env.VITE_UPLOAD_MAX_SIZE || '10485760'), // 10MB
  ENVIRONMENT: import.meta.env.MODE || 'development',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
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
