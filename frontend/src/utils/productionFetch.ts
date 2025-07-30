import { iosStorage } from './iosStorage';

/**
 * Enhanced fetch utility for iOS production environment
 * Handles token refresh and retry logic specifically for Railway deployment
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  includeAuth?: boolean;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch with retry logic and iOS-specific error handling
 */
export const fetchWithRetryAndAuth = async (
  url: string, 
  options: RequestInit = {}, 
  retryOptions: RetryOptions = {}
): Promise<Response> => {
  const {
    maxRetries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
    includeAuth = true
  } = retryOptions;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Prepare headers
      const headers = new Headers(options.headers);
      
      // Add auth token if required and not already present
      if (includeAuth && !headers.has('Authorization')) {
        // Try multiple storage methods to get the token
        let token = null;
        
        // Method 1: Try localStorage first (fastest)
        try {
          token = localStorage.getItem('auth_token');
        } catch (e) {
          console.log('📦 localStorage not available, trying iOS storage...');
        }
        
        // Method 2: Try iOS-compatible storage
        if (!token) {
          try {
            token = await iosStorage.getAuthToken();
          } catch (e) {
            console.log('📦 iOS storage failed, continuing without auth...');
          }
        }
        
        // Method 3: Check memory storage
        if (!token && (window as any).authToken) {
          token = (window as any).authToken;
          console.log('📦 Using memory-stored token');
        }
        
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
          console.log('🔐 Added auth token to request (attempt ' + (attempt + 1) + ')');
        } else {
          console.warn('⚠️ No auth token found for authenticated request (attempt ' + (attempt + 1) + ')');
        }
      }
      
      // iOS-specific headers
      headers.set('Cache-Control', 'no-cache');
      headers.set('Pragma', 'no-cache');
      
      // Enhanced options for iOS
      const enhancedOptions: RequestInit = {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'omit', // Avoid credential issues on iOS
        cache: 'no-cache',
      };
      
      // Make the request
      console.log(`🌐 Making request to ${url} (attempt ${attempt + 1}/${maxRetries + 1})`);
      const response = await fetch(url, enhancedOptions);
      
      // Check for authentication errors
      if (response.status === 401 && includeAuth) {
        console.warn('🔐 401 Unauthorized - token may be invalid or expired');
        
        // Clear potentially invalid tokens
        try {
          localStorage.removeItem('auth_token');
          await iosStorage.removeItem('auth_token');
          delete (window as any).authToken;
        } catch (e) {
          console.log('📦 Error clearing invalid tokens:', e);
        }
        
        // If this is not the last attempt, retry without auth to get a fresh error
        if (attempt < maxRetries) {
          console.log('🔄 Retrying request in', retryDelay, 'ms...');
          await sleep(retryDelay * (attempt + 1)); // Exponential backoff
          continue;
        }
      }
      
      // Check for network/server errors that should be retried
      if (!response.ok && attempt < maxRetries) {
        const shouldRetry = response.status >= 500 || response.status === 0;
        if (shouldRetry) {
          console.warn(`🔄 Request failed with status ${response.status}, retrying in ${retryDelay}ms...`);
          await sleep(retryDelay * (attempt + 1));
          continue;
        }
      }
      
      // Log successful requests
      if (response.ok) {
        console.log(`✅ Request successful: ${response.status} ${response.statusText}`);
      }
      
      return response;
      
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Request attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('💔 Network connectivity issue detected');
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      console.log(`🔄 Retrying in ${retryDelay * (attempt + 1)}ms...`);
      await sleep(retryDelay * (attempt + 1));
    }
  }
  
  // If we get here, all attempts failed
  throw new Error(`Request failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Store auth token in multiple locations for reliability
 */
export const storeAuthTokenReliably = async (token: string): Promise<void> => {
  const promises: Promise<any>[] = [];
  
  // Store in localStorage (if available)
  try {
    localStorage.setItem('auth_token', token);
    console.log('✅ Token stored in localStorage');
  } catch (e) {
    console.log('📦 localStorage not available for token storage');
  }
  
  // Store in iOS-compatible storage
  promises.push(
    iosStorage.setAuthToken(token).then(() => {
      console.log('✅ Token stored in iOS-compatible storage');
    }).catch(e => {
      console.log('📦 iOS storage failed for token:', e);
    })
  );
  
  // Store in memory as fallback
  (window as any).authToken = token;
  console.log('✅ Token stored in memory');
  
  // Wait for async storage operations
  await Promise.all(promises);
};

/**
 * Clear auth tokens from all storage locations
 */
export const clearAuthTokensReliably = async (): Promise<void> => {
  const promises: Promise<any>[] = [];
  
  // Clear from localStorage
  try {
    localStorage.removeItem('auth_token');
    console.log('🧹 Cleared token from localStorage');
  } catch (e) {
    console.log('📦 localStorage not available for clearing');
  }
  
  // Clear from iOS-compatible storage
  promises.push(
    iosStorage.removeItem('auth_token').then(() => {
      console.log('🧹 Cleared token from iOS-compatible storage');
    }).catch(e => {
      console.log('📦 iOS storage clear failed:', e);
    })
  );
  
  // Clear from memory
  delete (window as any).authToken;
  console.log('🧹 Cleared token from memory');
  
  // Wait for async clear operations
  await Promise.all(promises);
};
