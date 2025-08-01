/**
 * CSRF Protection Utilities
 * 
 * Provides client-side CSRF token generation and validation.
 * For enhanced security, tokens should also be validated on the backend.
 */

// Generate a cryptographically secure random token
export function generateCSRFToken(): string {
  if (window.crypto && window.crypto.getRandomValues) {
    // Use Web Crypto API for secure random generation
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback for older browsers
    return Math.random().toString(36).substring(2) + 
           Math.random().toString(36).substring(2) + 
           Date.now().toString(36);
  }
}

// Store CSRF token in sessionStorage (cleared on tab close)
export function setCSRFToken(token: string): void {
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch (error) {
    console.warn('Failed to store CSRF token:', error);
    // Fallback to memory storage
    (window as any).__csrfToken = token;
  }
}

// Retrieve CSRF token from storage
export function getCSRFToken(): string | null {
  try {
    return sessionStorage.getItem('csrf_token') || (window as any).__csrfToken || null;
  } catch (error) {
    console.warn('Failed to retrieve CSRF token:', error);
    return (window as any).__csrfToken || null;
  }
}

// Initialize CSRF token on page load
export function initializeCSRFToken(): string {
  let token = getCSRFToken();
  if (!token) {
    token = generateCSRFToken();
    setCSRFToken(token);
  }
  return token;
}

// Remove CSRF token (for logout)
export function clearCSRFToken(): void {
  try {
    sessionStorage.removeItem('csrf_token');
  } catch (error) {
    console.warn('Failed to clear CSRF token:', error);
  }
  delete (window as any).__csrfToken;
}

// Validate that a request should include CSRF token
export function shouldIncludeCSRFToken(method: string, url: string): boolean {
  // Include CSRF token for state-changing requests
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  // Exclude external URLs (different origin)
  try {
    const requestUrl = new URL(url, window.location.origin);
    const currentOrigin = new URL(window.location.href).origin;
    if (requestUrl.origin !== currentOrigin) {
      return false;
    }
  } catch {
    // If URL parsing fails, assume it's a relative URL (same origin)
  }
  
  return stateChangingMethods.includes(method.toUpperCase());
}
