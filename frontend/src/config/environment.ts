// Environment configuration for different deployment stages
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
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
      console.error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export default config;
