import config from '../config/environment';

// Fetch with timeout and abort signal
export const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = config.REQUEST_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    throw error;
  }
};

// Retry logic for failed requests
export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  delay: number = 1000
): Promise<Response> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      // Don't retry on client errors (4xx), only server errors (5xx) and network errors
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      lastError = error;
      
      if (i === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError!;
};
