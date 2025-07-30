import React, { useState } from 'react';
import type { Notification } from '../../types';
import { PasswordToggleIcon } from '../common/Icons';

interface LoginProps {
  onShowSignup: () => void;
  onLoginSuccess: () => void;
  setNotification: (notification: Notification) => void;
}

const LoginComponent: React.FC<LoginProps> = ({ onShowSignup, onLoginSuccess, setNotification }) => {
  const [restaurantCode, setRestaurantCode] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!restaurantCode || !password) {
      setNotification({ message: 'Please enter both restaurant code and password.', type: 'error' });
      return;
    }
    
    // Mock login check
    if (restaurantCode === 'TGK1234' && password === 'password123') {
      setNotification({ message: 'Login successful!', type: 'success' });
      setTimeout(() => {
        onLoginSuccess();
      }, 1000);
    } else {
      setNotification({ message: 'Invalid credentials.', type: 'error' });
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
            <label htmlFor="restaurantCode" className="block mb-2 text-sm font-medium text-gray-700">
              Restaurant Code
            </label>
            <input
              type="text"
              id="restaurantCode"
              value={restaurantCode}
              onChange={(e) => setRestaurantCode(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="e.g. TGK1234"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <PasswordToggleIcon isVisible={isPasswordVisible} />
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-sky-300 font-bold rounded-lg text-base px-5 py-3 text-center"
          >
            Sign In
          </button>
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onShowSignup}
                className="font-semibold text-sky-600 hover:underline focus:outline-none"
              >
                Register Your Restaurant
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginComponent;
