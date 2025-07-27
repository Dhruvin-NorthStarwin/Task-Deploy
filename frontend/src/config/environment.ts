// Environment configuration for different deployment stages
export const config = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  UPLOAD_MAX_SIZE: parseInt(process.env.REACT_APP_UPLOAD_MAX_SIZE || '10485760'), // 10MB
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  DEBUG: process.env.REACT_APP_DEBUG === 'true',
  REQUEST_TIMEOUT: parseInt(process.env.REACT_APP_REQUEST_TIMEOUT || '10000'), // 10 seconds
};

// Validate required environment variables in production
if (config.ENVIRONMENT === 'production') {
  const requiredEnvVars = ['REACT_APP_API_BASE_URL'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export default config;
