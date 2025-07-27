import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'staff' | 'admin';
  requireAuth?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  userRole: 'staff' | 'admin' | null;
  isLoading: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  requireAuth = true 
}) => {
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userRole: null,
    isLoading: true
  });

  useEffect(() => {
    // Check authentication status from localStorage or session
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userRole = localStorage.getItem('user_role') as 'staff' | 'admin' | null;
        const loginTimestamp = localStorage.getItem('login_timestamp');
        
        // Check if token exists and is still valid (within 60 minutes)
        const isTokenValid = token && loginTimestamp && 
          (Date.now() - parseInt(loginTimestamp)) < 60 * 60 * 1000; // 1 hour expiry
        
        setAuthState({
          isAuthenticated: !!isTokenValid,
          userRole: isTokenValid ? userRole : null,
          isLoading: false
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          isAuthenticated: false,
          userRole: null,
          isLoading: false
        });
      }
    };

    checkAuth();
  }, []);

  // Show loading spinner while checking auth
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !authState.isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to={`/?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If specific role is required but user doesn't have it
  if (requiredRole && authState.userRole !== requiredRole) {
    // Redirect based on user's actual role or to login if no role
    if (authState.userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (authState.userRole === 'staff') {
      return <Navigate to="/staff" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;
