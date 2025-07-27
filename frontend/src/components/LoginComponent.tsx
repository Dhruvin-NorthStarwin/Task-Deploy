import React, { useState } from 'react';
import apiService from '../services/apiService';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

const PasswordToggleIcon: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  return isVisible ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
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
    <div className={`fixed top-5 right-5 text-white py-3 px-6 rounded-lg shadow-lg transition-opacity duration-300 ${bgColor}`}>
      <p>{notification.message}</p>
    </div>
  );
};

const LoginComponent: React.FC<{ onShowSignup: () => void, onLoginSuccess: () => void, setNotification: (notification: Notification) => void }> = ({ onShowSignup, onLoginSuccess, setNotification }) => {
  const [restaurantCode, setRestaurantCode] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Auto-redirect to /pin if valid token exists in localStorage
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      window.location.pathname = '/pin';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!restaurantCode || !password) {
      setNotification({ message: 'Please enter both restaurant code and password.', type: 'error' });
      return;
    }
    try {
      const credentials = { restaurant_code: restaurantCode, password };
      const authResponse = await apiService.login(credentials);
      
      if (authResponse.token) {
        // Store the token
        localStorage.setItem('token', authResponse.token);
        if (rememberMe) {
          localStorage.setItem('auth_token', authResponse.token);
        } else {
          localStorage.removeItem('auth_token');
        }
        setNotification({ message: 'Login successful!', type: 'success' });
        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
      } else {
        setNotification({ message: 'Invalid credentials.', type: 'error' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setNotification({ message: 'Invalid credentials or server error. Please try again.', type: 'error' });
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Partner Login</h1>
          <p className="text-gray-600 mt-2">Welcome back! Please sign in to your account.</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label htmlFor="restaurantCode" className="block mb-2 text-sm font-medium text-gray-700">Restaurant Code</label>
            <input type="text" id="restaurantCode" value={restaurantCode} onChange={(e) => setRestaurantCode(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" placeholder="e.g. TGK1234" required />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input type={isPasswordVisible ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" placeholder="••••••••" required />
              <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                <PasswordToggleIcon isVisible={isPasswordVisible} />
              </button>
            </div>
          </div>
          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm font-medium text-gray-700">Remember me for 30 days</label>
          </div>
          <button type="submit" className="w-full text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-sky-300 font-bold rounded-lg text-base px-5 py-3 text-center">
            Sign In
          </button>
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button type="button" onClick={onShowSignup} className="font-semibold text-sky-600 hover:underline focus:outline-none">
                Register Your Restaurant
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export { LoginComponent, NotificationComponent };
