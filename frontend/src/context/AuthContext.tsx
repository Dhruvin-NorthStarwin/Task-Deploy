import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import * as apiService from '../services/apiService'; // Import the apiService
import { iosStorage, getStorageStatus } from '../utils/iosStorage';

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
  logoutToPin: () => void; // New partial logout function
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
        console.log('📦 Storage status:', getStorageStatus());
        
        const token = await iosStorage.getAuthToken();
        const userData = await iosStorage.getUserData();
        const savedRole = await iosStorage.getItem('user_role') as 'staff' | 'admin' | null;
        const pinVerified = await iosStorage.getItem('pin_verified') === 'true';
        
        console.log('🔍 AuthContext: Found in storage:', {
          hasToken: !!token,
          hasUserData: !!userData,
          savedRole,
          pinVerified
        });
        
        if (token && userData) {
          // The token itself is the source of truth, no need for time-based check here
          // The backend will validate it on each request.
          setUser(userData);
          setUserRoleState(savedRole);
          setIsPinVerified(pinVerified);
          
          console.log('✅ AuthContext: Auth state restored successfully');
          console.log('📦 iOS-compatible storage working!');
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
      console.log('📦 Storage status before login:', getStorageStatus());
      
      const response = await apiService.login(restaurantCode, password);
      
      if (response && response.token && response.restaurant) {
        const { token, restaurant } = response;
        console.log('✅ AuthContext: Login successful, storing data...');
        
        try {
          // Store auth data with iOS-compatible storage
          const tokenStored = await iosStorage.setAuthToken(token);
          const userDataStored = await iosStorage.setUserData(restaurant);
          
          if (!tokenStored || !userDataStored) {
            throw new Error('Failed to store authentication data - all storage methods failed');
          }
          
          console.log('✅ AuthContext: Data stored successfully with iOS-compatible storage');
          console.log('📦 Storage status after login:', getStorageStatus());
          
          // Verify data was stored
          const storedToken = await iosStorage.getAuthToken();
          const storedData = await iosStorage.getUserData();
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

  const logout = async () => {
    // Complete logout - Clear all auth-related data from state and storage
    setUser(null);
    setUserRoleState(null);
    setIsPinVerified(false);
    
    // Clear from iOS-compatible storage
    await iosStorage.clearAuth();
    await iosStorage.removeItem('user_role');
    await iosStorage.removeItem('pin_verified');
    await iosStorage.removeItem('login_timestamp'); // Also clear this legacy item
    
    console.log('🧹 Complete logout - Cleared all auth data from iOS-compatible storage');
    
    // Redirect to login page
    window.location.href = '/';
  };

  const logoutToPin = async () => {
    // Partial logout - Keep user authentication but clear PIN verification
    setUserRoleState(null);
    setIsPinVerified(false);
    
    // Clear PIN-related storage but keep authentication
    await iosStorage.removeItem('user_role');
    await iosStorage.removeItem('pin_verified');
    
    console.log('🔄 Partial logout - Cleared PIN data, keeping authentication');
    
    // Redirect to PIN entry page
    window.location.href = '/pin';
  };

  const setUserRole = async (role: 'staff' | 'admin') => {
    console.log('🔑 AuthContext: Setting user role to:', role);
    console.log('🔑 AuthContext: Current state - isAuthenticated:', !!user);
    
    setUserRoleState(role);
    setIsPinVerified(true);
    
    // Store with iOS-compatible storage
    await iosStorage.setItem('user_role', role);
    await iosStorage.setItem('pin_verified', 'true');
    
    console.log('✅ AuthContext: Role and PIN verification set successfully with iOS storage');
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
    logoutToPin,
    setUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
