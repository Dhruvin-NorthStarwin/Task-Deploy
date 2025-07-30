// Debug utilities to help troubleshoot API configuration
import { config } from '../config/environment';
import { debugEndpoints } from '../config/apiEndpoints';

export const debugApiConfig = () => {
  // Only run debug in development mode
  if (!config.DEBUG || config.ENVIRONMENT === 'production') {
    return true; // Return true to indicate config is fine
  }
  
  console.log('🔍 API Configuration Debug:');
  console.log('- API_BASE_URL:', config.API_BASE_URL);
  console.log('- ENVIRONMENT:', config.ENVIRONMENT);
  console.log('- DEBUG:', config.DEBUG);
  console.log('- Current Window Location:', window.location.href);
  
  // Ensure HTTPS for Railway
  if (config.API_BASE_URL.includes('radiant-amazement-production-d68f.up.railway.app') && 
      config.API_BASE_URL.startsWith('http://')) {
    console.error('❌ CRITICAL: API URL is using HTTP instead of HTTPS!');
    console.error('❌ This will cause Mixed Content errors');
    return false;
  }
  
  // Ensure API URL ends with /api
  if (!config.API_BASE_URL.endsWith('/api')) {
    console.warn('⚠️ WARNING: API URL does not end with /api');
    console.warn('⚠️ Current URL:', config.API_BASE_URL);
  }
  
  console.log('✅ API Configuration looks correct');
  
  // Debug all endpoints
  debugEndpoints();
  
  return true;
};

// Auto-run debug on import in development
if (config.DEBUG && config.ENVIRONMENT === 'development') {
  debugApiConfig();
}
