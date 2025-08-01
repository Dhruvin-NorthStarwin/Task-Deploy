import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import config from '../config/environment';
import IOSStorageDebug from './common/IOSStorageDebug';
import PWAInstallButton from './common/PWAInstallButton';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

const PasswordToggleIcon: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  return isVisible ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
      <line x1="2" x2="22" y1="2" y2="22"></line>
    </svg>
  );
};

const NotificationComponent: React.FC<{ notification: Notification | null }> = ({ notification }) => {
  if (!notification) return null;
  const bgColor = notification.type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className={`fixed top-3 left-2 right-2 xs:top-4 xs:left-4 xs:right-4 sm:top-5 sm:left-auto sm:right-5 sm:max-w-md text-white py-2 xs:py-3 px-3 xs:px-4 sm:px-6 rounded-md sm:rounded-lg shadow-lg transition-opacity duration-300 z-50 ${bgColor}`}>
      <p className="text-xs xs:text-sm sm:text-base break-words">{notification.message}</p>
    </div>
  );
};

const LoginComponent: React.FC<{ 
  onShowSignup: () => void, 
  onLoginSuccess: () => void, 
  setNotification: (notification: Notification) => void 
}> = ({ onShowSignup, onLoginSuccess, setNotification }) => {
  const [restaurantCode, setRestaurantCode] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isPinVerified, userRole } = useAuth();

  // Auto-redirect authenticated users to appropriate page
  React.useEffect(() => {
    if (isAuthenticated) {
      if (isPinVerified && userRole) {
        // Redirect to appropriate dashboard
        if (userRole === 'admin') {
          window.location.pathname = '/admin';
        } else if (userRole === 'staff') {
          window.location.pathname = '/staff';
        }
      } else {
        // Redirect to PIN page
        window.location.pathname = '/pin';
      }
    }
  }, [isAuthenticated, isPinVerified, userRole]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!restaurantCode || !password) {
      setNotification({ message: 'Please enter both restaurant code and password.', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔐 LoginComponent: Attempting login...');
      const success = await login(restaurantCode, password);
      if (success) {
        console.log('✅ LoginComponent: Login successful');
        onLoginSuccess();
      } else {
        console.log('❌ LoginComponent: Login failed - invalid credentials');
        setNotification({ message: 'Invalid credentials. Please check your restaurant code and password.', type: 'error' });
      }
    } catch (error: any) {
      console.error('❌ LoginComponent: Login error:', error);
      
      // Handle specific error types for iOS/Mac users
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message.includes('storage') || error.message.includes('Private Mode')) {
        errorMessage = 'Storage issue detected. Please disable Private Mode in Safari and try again.';
      } else if (error.message.includes('Network') || error.message.includes('connection')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please try again with a better internet connection.';
      } else if (error.message.includes('Invalid restaurant code')) {
        errorMessage = 'Restaurant not found. Please check your restaurant code.';
      } else if (error.message.includes('Invalid') || error.message.includes('credentials')) {
        errorMessage = 'Invalid restaurant code or password. Please try again.';
      } else if (error.message.includes('Security') || error.message.includes('CORS')) {
        errorMessage = 'Security restriction. Please make sure you are using the correct URL.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setNotification({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 flex items-center justify-center">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        {/* Logo Section - Ultra Mobile Optimized */}
        <div className="text-center mb-3 sm:mb-4 md:mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-600 rounded-full mb-2 sm:mb-3">
            <svg className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1">RestroManage</h1>
          <p className="text-gray-600 text-xs xs:text-sm md:text-base px-2">Sign in to your restaurant dashboard</p>
        </div>

        {/* iOS Storage Debug Info */}
        <IOSStorageDebug />

        {/* Login Form - Ultra Responsive */}
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl p-3 xs:p-4 sm:p-6 md:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6">
            {/* Restaurant Code Field - Ultra Responsive */}
            <div>
              <label htmlFor="restaurantCode" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 xs:mb-1.5 sm:mb-2">
                Restaurant Code
              </label>
              <input
                id="restaurantCode"
                type="text"
                value={restaurantCode}
                onChange={(e) => setRestaurantCode(e.target.value)}
                className="w-full px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm xs:text-base sm:text-lg font-medium"
                placeholder="Enter restaurant code"
                required
                autoComplete="username"
              />
            </div>

            {/* Password Field - Ultra Responsive */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 xs:mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 pr-8 xs:pr-10 sm:pr-12 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm xs:text-base sm:text-lg font-medium"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-1.5 xs:right-2 sm:right-3 flex items-center hover:text-blue-500 transition-colors p-1 xs:p-1.5"
                >
                  <PasswordToggleIcon isVisible={isPasswordVisible} />
                </button>
              </div>
            </div>

            {/* Login Button - Ultra Responsive */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 xs:py-3 sm:py-3.5 px-3 xs:px-4 sm:px-6 rounded-md sm:rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center text-sm xs:text-base sm:text-lg min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 xs:mr-3 h-4 w-4 xs:h-5 xs:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs xs:text-sm sm:text-base">Signing in...</span>
                </>
              ) : (
                <span className="text-sm xs:text-base sm:text-lg font-bold">LOGIN</span>
              )}
            </button>

            {/* PWA Install Button - Mobile Optimized */}
            <div className="text-center pt-1">
              <PWAInstallButton />
            </div>

            {/* Signup Link - Mobile Optimized */}
            <div className="text-center pt-1 xs:pt-2">
              <p className="text-gray-600 text-xs xs:text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onShowSignup}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 underline"
                >
                  Sign Up
                </button>
              </p>
            </div>

            {/* Debug Info (only in development) - Mobile Optimized */}
            {config.DEBUG && (
              <div className="mt-2 xs:mt-3 sm:mt-4 p-2 xs:p-3 bg-gray-100 rounded-md sm:rounded-lg text-xs text-gray-600">
                <p className="break-all">API URL = {config.API_BASE_URL}</p>
                <p>Environment = {config.ENVIRONMENT}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export { LoginComponent, NotificationComponent };
export type { Notification };
