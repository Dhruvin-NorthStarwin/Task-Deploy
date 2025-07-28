import config from '../config/environment';

// iOS Detection utility
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// iOS-optimized fetch with timeout and abort signal
export const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = config.REQUEST_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  
  // Extended timeout for iOS devices
  const iosTimeout = isIOS() ? Math.max(timeout, 30000) : timeout;
  const id = setTimeout(() => controller.abort(), iosTimeout);
  
  // Enhanced options for iOS compatibility
  const enhancedOptions: RequestInit = {
    ...options,
    signal: controller.signal,
    mode: options.mode || 'cors',
    cache: 'no-cache',
    redirect: 'follow',
  };
  
  // iOS-specific optimizations
  if (isIOS()) {
    enhancedOptions.credentials = 'omit'; // Avoid credential issues on iOS
    
    // Ensure headers are properly set for iOS
    const headers = new Headers(enhancedOptions.headers);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    enhancedOptions.headers = headers;
  }
  
  try {
    const response = await fetch(url, enhancedOptions);
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      const timeoutMsg = isIOS() ? 
        'Request timeout on iOS - please check your connection or try a different network' :
        'Request timeout - please check your connection';
      throw new Error(timeoutMsg);
    }
    
    // iOS-specific error handling
    if (isIOS() && error.message.includes('Failed to fetch')) {
      throw new Error('Network error on iOS - please check your internet connection or try switching between WiFi and cellular data');
    }
    
    throw error;
  }
};

// Enhanced retry logic for failed requests with iOS optimizations
export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  delay: number = 1000
): Promise<Response> => {
  let lastError: Error;
  
  // Increase retries for iOS devices
  const retries = isIOS() ? maxRetries + 2 : maxRetries;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      // Don't retry on client errors (4xx), only server errors (5xx) and network errors
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      lastError = error;
      
      if (i === retries) {
        break;
      }
      
      // iOS gets longer delays between retries
      const retryDelay = isIOS() ? delay * Math.pow(2, i) * 1.5 : delay * Math.pow(2, i);
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError!;
};
