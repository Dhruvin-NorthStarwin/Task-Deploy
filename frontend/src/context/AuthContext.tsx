import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import * as apiService from '../services/apiService'; // Import the apiService

interface User {
  id: string;
  name: string;
  role: 'staff' | 'admin';
  restaurant_id: string;
  restaurant_code: string; // Add restaurant_code
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPinVerified: boolean;
  userRole: 'staff' | 'admin' | null;
  login: (restaurantCode: string, password: string) => Promise<boolean>; // Correct parameter names
  setUserRole: (role: 'staff' | 'admin') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [userRole, setUserRoleState] = useState<'staff' | 'admin' | null>(null);

  useEffect(() => {
    // Check for existing authentication on app load
    const checkExistingAuth = async () => {
      try {
        console.log('🔍 AuthContext: Checking existing auth...');
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        const savedRole = localStorage.getItem('user_role') as 'staff' | 'admin' | null;
        const pinVerified = localStorage.getItem('pin_verified') === 'true';
        
        console.log('🔍 AuthContext: Found in storage:', {
          hasToken: !!token,
          hasUserData: !!userData,
          savedRole,
          pinVerified
        });
        
        if (token && userData) {
          // The token itself is the source of truth, no need for time-based check here
          // The backend will validate it on each request.
          const parsedUserData = JSON.parse(userData);
          setUser(parsedUserData);
          setUserRoleState(savedRole);
          setIsPinVerified(pinVerified);
          
          console.log('✅ AuthContext: Auth state restored successfully');
        } else {
          console.log('❌ AuthContext: No valid auth data found');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error checking existing auth:', error);
        // Clear storage on error to prevent corruption
        console.log('🧹 AuthContext: Clearing corrupted storage');
        logout();
      } finally {
        setIsLoading(false);
        console.log('✅ AuthContext: Loading complete');
      }
    };

    checkExistingAuth();
  }, []);

  const login = async (restaurantCode: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Starting login process...');
      console.log('🔐 AuthContext: Browser info:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language
      });
      
      // Test localStorage availability before proceeding
      try {
        const testKey = 'storage_test_' + Date.now();
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        console.log('✅ AuthContext: localStorage is available');
      } catch (storageError) {
        console.error('❌ AuthContext: localStorage not available:', storageError);
        throw new Error('Browser storage is not available. Please disable Private Mode or check browser settings.');
      }
      
      const response = await apiService.login(restaurantCode, password);
      
      if (response && response.token && response.restaurant) {
        const { token, restaurant } = response;
        console.log('✅ AuthContext: Login successful, storing data...');
        
        try {
          // Store auth data with error handling
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user_data', JSON.stringify(restaurant));
          console.log('✅ AuthContext: Data stored successfully');
          
          // Verify data was stored
          const storedToken = localStorage.getItem('auth_token');
          const storedData = localStorage.getItem('user_data');
          if (!storedToken || !storedData) {
            throw new Error('Failed to verify stored authentication data');
          }
          
        } catch (storageError) {
          console.error('❌ AuthContext: Failed to store auth data:', storageError);
          throw new Error('Failed to save login information. Please check your browser settings.');
        }
        
        setUser(restaurant);
        setUserRoleState(null); // Reset role - will be set via PIN
        setIsPinVerified(false); // Reset PIN verification on new login
        localStorage.removeItem('pin_verified');
        localStorage.removeItem('user_role');

        console.log('✅ AuthContext: Login completed successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('❌ AuthContext: Login failed:', error);
      
      // Provide user-friendly error messages for iOS/Mac users
      let userMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        userMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        userMessage = 'Connection timeout. Please try again with a better internet connection.';
      } else if (error.message.includes('storage') || error.message.includes('Storage')) {
        userMessage = 'Browser storage issue. Please disable Private Mode and try again.';
      } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        userMessage = 'Security restriction. Please make sure you are accessing the correct URL.';
      }
      
      // Re-throw with user-friendly message so UI can catch it
      throw new Error(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear all auth-related data from state and storage
    setUser(null);
    setUserRoleState(null);
    setIsPinVerified(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_role');
    localStorage.removeItem('pin_verified');
    localStorage.removeItem('login_timestamp'); // Also clear this legacy item
    // Optionally, redirect to login page
    window.location.href = '/login';
  };

  const setUserRole = (role: 'staff' | 'admin') => {
    console.log('🔑 AuthContext: Setting user role to:', role);
    console.log('🔑 AuthContext: Current state - isAuthenticated:', !!user);
    
    setUserRoleState(role);
    setIsPinVerified(true);
    localStorage.setItem('user_role', role);
    localStorage.setItem('pin_verified', 'true');
    
    console.log('✅ AuthContext: Role and PIN verification set successfully');
    console.log('🔑 AuthContext: New state - userRole:', role, 'isPinVerified: true');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isPinVerified,
    userRole,
    login,
    logout,
    setUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
