import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'staff' | 'admin';
  requireAuth?: boolean;
  requirePin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  requireAuth = true,
  requirePin = false
}) => {
  const location = useLocation();
  const { isAuthenticated, isPinVerified, userRole, isLoading } = useAuth();

  console.log('🛡️ ProtectedRoute Check:', {
    path: location.pathname,
    isAuthenticated,
    isPinVerified,
    userRole,
    requiredRole,
    requireAuth,
    requirePin,
    isLoading
  });

  // Show loading spinner while checking auth
  if (isLoading) {
    console.log('⏳ ProtectedRoute: Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    console.log('❌ ProtectedRoute: User not authenticated, redirecting to login');
    // Redirect to login with return URL
    return <Navigate to={`/?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If PIN verification is required but not verified
  if (requirePin && isAuthenticated && !isPinVerified) {
    console.log('❌ ProtectedRoute: PIN not verified, redirecting to PIN page');
    return <Navigate to="/pin" replace />;
  }

  // If specific role is required but user doesn't have it
  if (requiredRole && userRole !== requiredRole) {
    console.log('❌ ProtectedRoute: Role mismatch. Required:', requiredRole, 'Current:', userRole);
    // If no role is set yet, redirect to PIN
    if (!userRole) {
      console.log('➡️ ProtectedRoute: No role set, redirecting to PIN');
      return <Navigate to="/pin" replace />;
    }
    
    // Redirect based on user's actual role
    if (userRole === 'admin') {
      console.log('➡️ ProtectedRoute: Redirecting to admin dashboard');
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'staff') {
      console.log('➡️ ProtectedRoute: Redirecting to staff dashboard');
      return <Navigate to="/staff" replace />;
    } else {
      console.log('➡️ ProtectedRoute: Unknown role, redirecting to PIN');
      return <Navigate to="/pin" replace />;
    }
  }

  console.log('✅ ProtectedRoute: All checks passed, rendering protected content');
  // User is authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;
