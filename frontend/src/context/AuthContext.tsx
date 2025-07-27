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
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        const savedRole = localStorage.getItem('user_role') as 'staff' | 'admin' | null;
        const pinVerified = localStorage.getItem('pin_verified') === 'true';
        
        if (token && userData) {
          // The token itself is the source of truth, no need for time-based check here
          // The backend will validate it on each request.
          setUser(JSON.parse(userData));
          setUserRoleState(savedRole);
          setIsPinVerified(pinVerified);
        }
      } catch (error) {
        console.error('Error checking existing auth:', error);
        // Clear storage on error
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const login = async (restaurantCode: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(restaurantCode, password);
      
      if (response && response.access_token && response.user) {
        const { access_token, user } = response;
        
        // Store auth data
        localStorage.setItem('auth_token', access_token);
        localStorage.setItem('user_data', JSON.stringify(user));
        localStorage.setItem('user_role', user.role);
        
        setUser(user);
        setUserRoleState(user.role);
        setIsPinVerified(false); // Reset PIN verification on new login
        localStorage.removeItem('pin_verified');

        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
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
    setUserRoleState(role);
    localStorage.setItem('user_role', role);
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
