/**
 * iOS-compatible storage utility for JWT tokens
 * Handles localStorage limitations on iOS Safari
 */

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const STORAGE_TEST_KEY = 'storage_test';

class IOSCompatibleStorage {
  private memoryStorage: Map<string, any> = new Map();
  private isLocalStorageAvailable = false;
  private isIndexedDBAvailable = false;
  private dbName = 'RestroManageDB';
  private dbVersion = 1;
  private storeName = 'auth';

  constructor() {
    this.checkStorageAvailability();
    this.initIndexedDB();
  }

  /**
   * Check what storage methods are available
   */
  private checkStorageAvailability(): void {
    // Test localStorage
    try {
      const testKey = STORAGE_TEST_KEY + '_' + Date.now();
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = retrieved === 'test';
      console.log('📦 localStorage available:', this.isLocalStorageAvailable);
    } catch (error) {
      console.warn('📦 localStorage not available:', error);
      this.isLocalStorageAvailable = false;
    }

    // Test IndexedDB
    this.isIndexedDBAvailable = 'indexedDB' in window;
    console.log('📦 IndexedDB available:', this.isIndexedDBAvailable);
  }

  /**
   * Initialize IndexedDB for iOS Safari fallback
   */
  private async initIndexedDB(): Promise<void> {
    if (!this.isIndexedDBAvailable) return;

    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('📦 IndexedDB failed to open');
        this.isIndexedDBAvailable = false;
        resolve();
      };

      request.onsuccess = () => {
        console.log('📦 IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Store data using the best available method
   */
  async setItem(key: string, value: string): Promise<boolean> {
    const data = { key, value, timestamp: Date.now() };

    // Always store in memory as primary cache
    this.memoryStorage.set(key, value);

    // Try localStorage first (fastest)
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.setItem(key, value);
        console.log(`📦 Stored ${key} in localStorage`);
        return true;
      } catch (error) {
        console.warn(`📦 localStorage failed for ${key}:`, error);
        this.isLocalStorageAvailable = false;
      }
    }

    // Fallback to IndexedDB
    if (this.isIndexedDBAvailable) {
      try {
        await this.setIndexedDBItem(data);
        console.log(`📦 Stored ${key} in IndexedDB`);
        return true;
      } catch (error) {
        console.warn(`📦 IndexedDB failed for ${key}:`, error);
        this.isIndexedDBAvailable = false;
      }
    }

    // Fallback to cookies for critical data like tokens
    if (key === TOKEN_KEY) {
      try {
        this.setCookie(key, value, 7); // 7 days expiry
        console.log(`📦 Stored ${key} in cookie`);
        return true;
      } catch (error) {
        console.warn(`📦 Cookie storage failed for ${key}:`, error);
      }
    }

    console.log(`📦 Using memory storage only for ${key}`);
    return true; // Memory storage always works
  }

  /**
   * Retrieve data using the best available method
   */
  async getItem(key: string): Promise<string | null> {
    // Check memory first (fastest)
    if (this.memoryStorage.has(key)) {
      const value = this.memoryStorage.get(key);
      console.log(`📦 Retrieved ${key} from memory`);
      return value;
    }

    // Try localStorage
    if (this.isLocalStorageAvailable) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) {
          this.memoryStorage.set(key, value); // Cache in memory
          console.log(`📦 Retrieved ${key} from localStorage`);
          return value;
        }
      } catch (error) {
        console.warn(`📦 localStorage read failed for ${key}:`, error);
        this.isLocalStorageAvailable = false;
      }
    }

    // Try IndexedDB
    if (this.isIndexedDBAvailable) {
      try {
        const data = await this.getIndexedDBItem(key);
        if (data) {
          this.memoryStorage.set(key, data.value); // Cache in memory
          console.log(`📦 Retrieved ${key} from IndexedDB`);
          return data.value;
        }
      } catch (error) {
        console.warn(`📦 IndexedDB read failed for ${key}:`, error);
        this.isIndexedDBAvailable = false;
      }
    }

    // Try cookies as last resort
    if (key === TOKEN_KEY) {
      try {
        const value = this.getCookie(key);
        if (value) {
          this.memoryStorage.set(key, value); // Cache in memory
          console.log(`📦 Retrieved ${key} from cookie`);
          return value;
        }
      } catch (error) {
        console.warn(`📦 Cookie read failed for ${key}:`, error);
      }
    }

    console.log(`📦 No data found for ${key}`);
    return null;
  }

  /**
   * Remove data from all storage methods
   */
  async removeItem(key: string): Promise<void> {
    // Remove from memory
    this.memoryStorage.delete(key);

    // Remove from localStorage
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`📦 localStorage removal failed for ${key}:`, error);
      }
    }

    // Remove from IndexedDB
    if (this.isIndexedDBAvailable) {
      try {
        await this.removeIndexedDBItem(key);
      } catch (error) {
        console.warn(`📦 IndexedDB removal failed for ${key}:`, error);
      }
    }

    // Remove from cookies
    if (key === TOKEN_KEY) {
      try {
        this.removeCookie(key);
      } catch (error) {
        console.warn(`📦 Cookie removal failed for ${key}:`, error);
      }
    }
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    this.memoryStorage.clear();

    if (this.isLocalStorageAvailable) {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('📦 localStorage clear failed:', error);
      }
    }

    if (this.isIndexedDBAvailable) {
      try {
        await this.clearIndexedDB();
      } catch (error) {
        console.warn('📦 IndexedDB clear failed:', error);
      }
    }

    // Clear auth cookies
    this.removeCookie(TOKEN_KEY);
    this.removeCookie(USER_DATA_KEY);
  }

  // IndexedDB helper methods
  private async setIndexedDBItem(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const putRequest = store.put(data);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async getIndexedDBItem(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const getRequest = store.get(key);
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async removeIndexedDBItem(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const deleteRequest = store.delete(key);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Cookie helper methods (for iOS Safari compatibility)
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    // iOS Safari requires Secure flag in many cases
    const isSecure = location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secureFlag}`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  private removeCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  // Convenience methods for auth data
  async setAuthToken(token: string): Promise<boolean> {
    return this.setItem(TOKEN_KEY, token);
  }

  async getAuthToken(): Promise<string | null> {
    return this.getItem(TOKEN_KEY);
  }

  async setUserData(userData: any): Promise<boolean> {
    return this.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }

  async getUserData(): Promise<any> {
    const data = await this.getItem(USER_DATA_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.warn('📦 Failed to parse user data:', error);
        return null;
      }
    }
    return null;
  }

  async clearAuth(): Promise<void> {
    await this.removeItem(TOKEN_KEY);
    await this.removeItem(USER_DATA_KEY);
  }

  // Get storage status for debugging
  getStorageStatus(): object {
    return {
      localStorage: this.isLocalStorageAvailable,
      indexedDB: this.isIndexedDBAvailable,
      memoryCache: this.memoryStorage.size,
      cookiesEnabled: navigator.cookieEnabled
    };
  }
}

// Create and export singleton instance
export const iosStorage = new IOSCompatibleStorage();

// Export convenience functions
export const setAuthToken = (token: string) => iosStorage.setAuthToken(token);
export const getAuthToken = () => iosStorage.getAuthToken();
export const setUserData = (userData: any) => iosStorage.setUserData(userData);
export const getUserData = () => iosStorage.getUserData();
export const clearAuth = () => iosStorage.clearAuth();
export const getStorageStatus = () => iosStorage.getStorageStatus();
