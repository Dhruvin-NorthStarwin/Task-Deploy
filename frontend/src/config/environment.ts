// Get the API URL with proper fallback logic
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const isDev = import.meta.env.MODE === 'development';
  
  // Force HTTPS for specific known Railway deployments
  if (envUrl && envUrl.includes('radiant-amazement-production-d68f.up.railway.app')) {
    let httpsUrl = envUrl.replace('http://', 'https://');
    
    // Ensure the URL ends with /api for backend endpoints
    if (!httpsUrl.endsWith('/api') && !httpsUrl.endsWith('/api/')) {
      httpsUrl = httpsUrl.endsWith('/') ? httpsUrl + 'api' : httpsUrl + '/api';
    }
    
    console.log('🔒 Ensuring HTTPS and /api path for Railway backend:', httpsUrl);
    return httpsUrl;
  }
  
  // In development, use localhost (can be switched to HTTPS if needed)
  if (isDev && !envUrl) {
    return 'http://localhost:8000/api';
  }

  // In production, always use HTTPS for Railway fallback
  if (!isDev && !envUrl) {
    console.warn('⚠️ VITE_API_BASE_URL not set, using default Railway HTTPS URL');
    return 'https://radiant-amazement-production-d68f.up.railway.app/api';
  }
  
  // If we have an envUrl but we're in production, ensure it's HTTPS and has /api
  if (!isDev && envUrl) {
    let finalUrl = envUrl.startsWith('http://') ? envUrl.replace('http://', 'https://') : envUrl;
    
    // Ensure the URL ends with /api for backend endpoints
    if (!finalUrl.endsWith('/api') && !finalUrl.endsWith('/api/')) {
      finalUrl = finalUrl.endsWith('/') ? finalUrl + 'api' : finalUrl + '/api';
    }
    
    console.log('🔒 Final API URL for production:', finalUrl);
    return finalUrl;
  }

  return envUrl;
};// Environment configuration for different deployment stages
export const config = {
  API_BASE_URL: getApiUrl(),
  UPLOAD_MAX_SIZE: parseInt(import.meta.env.VITE_UPLOAD_MAX_SIZE || '10485760'), // 10MB
  ENVIRONMENT: import.meta.env.MODE || 'development',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  REQUEST_TIMEOUT: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '10000'), // 10 seconds
};

// Debug: Log the API URL being used
console.log('🔍 API_BASE_URL:', config.API_BASE_URL);
console.log('🔍 Environment Mode:', config.ENVIRONMENT);
console.log('🔍 VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);

// Validate required environment variables in production
if (config.ENVIRONMENT === 'production') {
  const requiredEnvVars = ['VITE_API_BASE_URL'];
  
  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      console.warn(`⚠️ Environment variable ${envVar} not set, using fallback value`);
    }
  }
}

export default config;
