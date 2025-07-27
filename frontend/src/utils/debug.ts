// Debug utilities to help troubleshoot API configuration
import { config } from '../config/environment';

export const debugApiConfig = () => {
  console.log('🔍 API Configuration Debug:');
  console.log('- API_BASE_URL:', config.API_BASE_URL);
  console.log('- ENVIRONMENT:', config.ENVIRONMENT);
  console.log('- MODE:', import.meta.env.MODE);
  console.log('- VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('- Current Window Location:', window.location.href);
  
  // Ensure HTTPS for Railway
  if (config.API_BASE_URL.includes('radiant-amazement-production-d68f.up.railway.app') && 
      config.API_BASE_URL.startsWith('http://')) {
    console.error('❌ CRITICAL: API URL is using HTTP instead of HTTPS!');
    console.error('❌ This will cause Mixed Content errors');
    return false;
  }
  
  console.log('✅ API Configuration looks correct');
  return true;
};

// Auto-run debug on import in development
if (import.meta.env.MODE === 'development') {
  debugApiConfig();
}
