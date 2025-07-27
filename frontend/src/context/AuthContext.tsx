import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  role: 'staff' | 'admin';
  restaurant_id: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPinVerified: boolean;
  userRole: 'staff' | 'admin' | null;
  login: (email: string, password: string) => Promise<boolean>;
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
        const loginTimestamp = localStorage.getItem('login_timestamp');
        const savedRole = localStorage.getItem('user_role') as 'staff' | 'admin' | null;
        const pinVerified = localStorage.getItem('pin_verified') === 'true';
        
        if (token && userData && loginTimestamp) {
          // Check if token is still valid (within 1 hour)
          const isTokenValid = (Date.now() - parseInt(loginTimestamp)) < 60 * 60 * 1000;
          
          if (isTokenValid) {
            setUser(JSON.parse(userData));
            setUserRoleState(savedRole);
            setIsPinVerified(pinVerified);
          } else {
            // Token expired, clear storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            localStorage.removeItem('user_role');
            localStorage.removeItem('pin_verified');
            localStorage.removeItem('login_timestamp');
          }
        }
      } catch (error) {
        console.error('Error checking existing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const login = async (_email: string, _password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // This would normally be an API call to your backend
      // For now, simulate a successful login
      const mockUser: User = {
        id: '1',
        name: 'Restaurant User',
        role: 'admin', // This should come from your API
        restaurant_id: '1'
      };
      
      // Store auth data
      const token = 'mock_jwt_token'; // This should come from your API
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      localStorage.setItem('login_timestamp', Date.now().toString());
      
      setUser(mockUser);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setUserRole = (role: 'staff' | 'admin') => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      setUserRoleState(role);
      setIsPinVerified(true);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      localStorage.setItem('user_role', role);
      localStorage.setItem('pin_verified', 'true');
    }
  };

  const logout = () => {
    setUser(null);
    setUserRoleState(null);
    setIsPinVerified(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_role');
    localStorage.removeItem('pin_verified');
    localStorage.removeItem('login_timestamp');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isPinVerified,
    userRole,
    isLoading,
    login,
    setUserRole,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
