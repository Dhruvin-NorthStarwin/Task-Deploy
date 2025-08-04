import React, { useState } from 'react';
import type { Location, Notification } from '../../types';
import { PasswordToggleIcon } from '../common/Icons';
import * as apiService from '../../services/apiService';

interface SignupProps {
  onShowLogin: () => void;
  onRegistrationSuccess: (code: string) => void;
  setNotification: (notification: Notification) => void;
}

interface ValidationErrors {
  restaurantName?: string;
  cuisineType?: string;
  contactEmail?: string;
  contactPhone?: string;
  password?: string;
  confirmPassword?: string;
  locations?: string;
  terms?: string;
}

const SignupComponent: React.FC<SignupProps> = ({ onShowLogin, onRegistrationSuccess, setNotification }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [locations, setLocations] = useState<Location[]>([{ addressLine1: '', townCity: '', postcode: '' }]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [terms, setTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Validation functions
  const validateEmail = (email: string): boolean => {
    // More strict email validation to match backend EmailStr requirements
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Restaurant name validation
    if (!restaurantName.trim()) {
      errors.restaurantName = 'Restaurant name is required';
    } else if (restaurantName.trim().length < 2) {
      errors.restaurantName = 'Restaurant name must be at least 2 characters';
    }

    // Cuisine type validation
    if (!cuisineType.trim()) {
      errors.cuisineType = 'Cuisine type is required';
    }

    // Email validation
    if (!contactEmail.trim()) {
      errors.contactEmail = 'Email is required';
    } else if (!validateEmail(contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    // Phone validation
    if (!contactPhone.trim()) {
      errors.contactPhone = 'Phone number is required';
    } else if (!validatePhone(contactPhone)) {
      errors.contactPhone = 'Please enter a valid phone number';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Locations validation
    const isLocationsValid = locations.every(l => 
      l.addressLine1.trim() && l.townCity.trim() && l.postcode.trim()
    );
    if (!isLocationsValid) {
      errors.locations = 'Please fill out all location fields';
    }

    // Terms validation
    if (!terms) {
      errors.terms = 'You must agree to the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLocationChange = (index: number, field: keyof Location, value: string) => {
    const newLocations = [...locations];
    newLocations[index][field] = value;
    setLocations(newLocations);
    
    // Clear location validation error when user starts typing
    if (validationErrors.locations) {
      setValidationErrors(prev => ({ ...prev, locations: undefined }));
    }
  };

  const addLocation = () => {
    setLocations([...locations, { addressLine1: '', townCity: '', postcode: '' }]);
  };

  const removeLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index);
    setLocations(newLocations);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setNotification({ message: 'Please fix the validation errors below.', type: 'error' });
      return;
    }

    setIsLoading(true);
    
    try {
      const registrationPayload = {
        name: restaurantName.trim(),
        cuisine_type: cuisineType.trim(),
        locations: locations.map(loc => ({
          address_line1: loc.addressLine1.trim(),
          town_city: loc.townCity.trim(),
          postcode: loc.postcode.trim().toUpperCase()
        })),
        contact_email: contactEmail.trim().toLowerCase(),
        contact_phone: contactPhone.trim(),
        password: password.trim()
      };

      // Debug logging to help identify the issue
      console.log('🔍 Registration payload:', {
        ...registrationPayload,
        password: '[HIDDEN]',
        dataTypes: {
          name: typeof registrationPayload.name,
          cuisine_type: typeof registrationPayload.cuisine_type,
          contact_email: typeof registrationPayload.contact_email,
          contact_phone: typeof registrationPayload.contact_phone,
          locations: Array.isArray(registrationPayload.locations),
          locationCount: registrationPayload.locations.length
        }
      });

      const response = await apiService.register(registrationPayload);

      if (response.restaurant_code) {
        setNotification({ 
          message: 'Restaurant registered successfully! Please save your restaurant code.', 
          type: 'success' 
        });
        onRegistrationSuccess(response.restaurant_code);
      } else {
        setNotification({ 
          message: response.message || 'Registration failed. Please try again.', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Network error. Please check your connection and try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Validation failed')) {
          errorMessage = `Please check your input: ${error.message}`;
        } else if (error.message.includes('422')) {
          errorMessage = 'Please verify all fields are filled correctly and try again.';
        } else if (error.message.includes('400')) {
          errorMessage = 'This email may already be registered. Please try a different email.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setNotification({ 
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Register Your Restaurant</h1>
          <p className="text-gray-600 mt-2">Partner with us and reach more customers across the UK.</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label htmlFor="restaurantName" className="block mb-2 text-sm font-medium text-gray-700">
              Restaurant Name *
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => {
                setRestaurantName(e.target.value);
                if (validationErrors.restaurantName) {
                  setValidationErrors(prev => ({ ...prev, restaurantName: undefined }));
                }
              }}
              className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-sky-500 ${
                validationErrors.restaurantName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., The Gourmet Kitchen"
              required
            />
            {validationErrors.restaurantName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.restaurantName}</p>
            )}
          </div>
          
          <div className="mb-5">
            <label htmlFor="cuisineType" className="block mb-2 text-sm font-medium text-gray-700">
              Cuisine Type *
            </label>
            <input
              type="text"
              value={cuisineType}
              onChange={(e) => {
                setCuisineType(e.target.value);
                if (validationErrors.cuisineType) {
                  setValidationErrors(prev => ({ ...prev, cuisineType: undefined }));
                }
              }}
              className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-sky-500 ${
                validationErrors.cuisineType ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Italian, Indian, Fast Food"
              required
            />
            {validationErrors.cuisineType && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.cuisineType}</p>
            )}
          </div>
          
          {/* Locations */}
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Locations *
            </label>
            <div className="space-y-4">
              {locations.map((loc, index) => (
                <div key={index} className={`location-entry p-4 border rounded-lg bg-gray-50/80 relative ${
                  validationErrors.locations ? 'border-red-500' : 'border-gray-300'
                }`}>
                  {locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLocation(index)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-lg"
                    >
                      &times;
                    </button>
                  )}
                  <h3 className="font-semibold text-gray-700 mb-3">Location {index + 1}</h3>
                  <div className="mb-3">
                    <label className="block mb-2 text-xs font-medium text-gray-600">Address Line 1</label>
                    <input
                      type="text"
                      value={loc.addressLine1}
                      onChange={e => handleLocationChange(index, 'addressLine1', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-xs font-medium text-gray-600">Town/City</label>
                      <input
                        type="text"
                        value={loc.townCity}
                        onChange={e => handleLocationChange(index, 'townCity', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-xs font-medium text-gray-600">Postcode</label>
                      <input
                        type="text"
                        value={loc.postcode}
                        onChange={e => handleLocationChange(index, 'postcode', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {validationErrors.locations && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.locations}</p>
            )}
          </div>
          <div className="mb-5">
            <button
              type="button"
              onClick={addLocation}
              className="w-full text-sky-700 bg-sky-100 hover:bg-sky-200 focus:ring-4 focus:ring-sky-300 font-bold rounded-lg text-sm px-5 py-2.5 text-center"
            >
              + Add Another Location
            </button>
          </div>

          {/* Contact & Password Details */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact & Account Details</h2>
            
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Contact Email *
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  if (validationErrors.contactEmail) {
                    setValidationErrors(prev => ({ ...prev, contactEmail: undefined }));
                  }
                }}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-sky-500 ${
                  validationErrors.contactEmail ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="restaurant@example.com"
                required
              />
              {validationErrors.contactEmail && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.contactEmail}</p>
              )}
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Contact Phone *
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => {
                  setContactPhone(e.target.value);
                  if (validationErrors.contactPhone) {
                    setValidationErrors(prev => ({ ...prev, contactPhone: undefined }));
                  }
                }}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-sky-500 ${
                  validationErrors.contactPhone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+44 1234 567890"
                required
              />
              {validationErrors.contactPhone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.contactPhone}</p>
              )}
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="relative">
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-sky-500 pr-12 ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
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
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (validationErrors.confirmPassword) {
                      setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-sky-500 pr-12 ${
                    validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <PasswordToggleIcon isVisible={isConfirmPasswordVisible} />
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Terms and Submit */}
          <div className="mb-8">
            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                checked={terms}
                onChange={(e) => {
                  setTerms(e.target.checked);
                  if (validationErrors.terms) {
                    setValidationErrors(prev => ({ ...prev, terms: undefined }));
                  }
                }}
                className={`w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 ${
                  validationErrors.terms ? 'border-red-500' : ''
                }`}
                required
              />
              <label htmlFor="terms" className="ml-2 text-sm font-medium text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-sky-600 hover:underline">
                  terms and conditions
                </a>
                . *
              </label>
            </div>
            {validationErrors.terms && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.terms}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold rounded-lg text-base px-5 py-3 text-center ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-300'
            }`}
          >
            {isLoading ? 'Registering...' : 'Register Restaurant'}
          </button>
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onShowLogin}
                className="font-semibold text-sky-600 hover:underline focus:outline-none"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupComponent;
