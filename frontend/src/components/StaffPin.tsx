import React, { useState, useEffect, useCallback } from 'react';
import PWAInstallButton from './common/PWAInstallButton';
import { useAuth } from '../context/AuthContext';

interface PinProps {
  onLogin: (role: 'staff' | 'admin') => void;
}

// Helper component for individual keypad buttons
const KeypadButton = ({ onClick, children, className = '', ...props }: any) => (
    <button
        onClick={onClick}
        className={`keypad-btn text-2xl font-semibold rounded-full h-16 w-16 mx-auto flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-95 shadow-sm ${className}`}
        {...props}
    >
        {children}
    </button>
);

// Icon for the backspace button
const BackspaceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5.83 5.146a.5.5 0 0 0 0 .708L7.975 8l-2.147 2.146a.5.5 0 0 0 .707.708l2.147-2.147 2.146 2.147a.5.5 0 0 0 .707-.708L9.39 8l2.146-2.146a.5.5 0 0 0-.707-.708L8.683 7.293 6.536 5.146a.5.5 0 0 0-.707 0z"/>
      <path d="M13.683 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7.08a2 2 0 0 1-1.519-.698L.241 8.65a1 1 0 0 1 0-1.302L5.084 1.7A2 2 0 0 1 6.603 1h7.08zm-7.08 1a1 1 0 0 0-.76.35L1 8l4.844 5.65a1 1 0 0 0 .759.35h7.08a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-7.08z"/>
    </svg>
);

const StaffPin: React.FC<PinProps> = ({ onLogin }) => {
    const [enteredPin, setEnteredPin] = useState('');
    const [message, setMessage] = useState<{ text: string; type: string }>({ text: '', type: '' });
    const [animation, setAnimation] = useState('');
    const { logout } = useAuth();

    // Staff/admin PINs
    const staffPin = '0000';
    const adminPin = '5678';

    // Complete logout function (back to restaurant login)
    const handleCompleteLogout = () => {
        logout();
    };

    // Reset PIN and message
    const resetPin = useCallback((clearMessage = true) => {
        setEnteredPin('');
        if (clearMessage) {
            setMessage({ text: '', type: '' });
        }
    }, []);

    // Verify PIN and call onLogin
    const verifyPin = useCallback(() => {
        console.log('🔍 PIN Verification - Entered PIN:', enteredPin);
        console.log('🔍 PIN Verification - Staff PIN:', staffPin, 'Admin PIN:', adminPin);
        
        if (enteredPin === staffPin) {
            console.log('✅ Staff PIN accepted!');
            setMessage({ text: 'Staff PIN Accepted!', type: 'success' });
            setAnimation('animate-pulse');
            setTimeout(() => {
                setAnimation('');
                resetPin();
                console.log('🔄 Calling onLogin with role: staff');
                onLogin('staff');
            }, 800);
        } else if (enteredPin === adminPin) {
            console.log('✅ Admin PIN accepted!');
            setMessage({ text: 'Admin PIN Accepted!', type: 'success' });
            setAnimation('animate-pulse');
            setTimeout(() => {
                setAnimation('');
                resetPin();
                console.log('🔄 Calling onLogin with role: admin');
                onLogin('admin');
            }, 800);
        } else {
            console.log('❌ Invalid PIN entered:', enteredPin);
            setMessage({ text: 'Invalid PIN. Try again.', type: 'error' });
            setAnimation('animate-bounce');
            setTimeout(() => {
                setAnimation('');
                resetPin();
            }, 1000);
        }
    }, [enteredPin, resetPin, onLogin, staffPin, adminPin]);

    useEffect(() => {
        if (enteredPin.length === 4) {
            const timer = setTimeout(verifyPin, 200);
            return () => clearTimeout(timer);
        }
    }, [enteredPin, verifyPin]);

    const handleNumberClick = (value: string) => {
        if (message.text) {
            setMessage({ text: '', type: '' });
        }
        if (enteredPin.length < 4) {
            setEnteredPin(prevPin => prevPin + value);
        }
    };

    const handleBackspace = () => {
        setMessage({ text: '', type: '' });
        setEnteredPin(prevPin => prevPin.slice(0, -1));
    };

    const handleClear = () => {
        resetPin(true);
    };

    const messageColor = message.type === 'success' ? 'text-green-500' : message.type === 'error' ? 'text-red-500' : '';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
            <div className="w-full max-w-sm mx-auto">
                {/* Header Section with Logout and Install buttons */}
                <div className="flex justify-between items-start mb-4">
                    <button
                        onClick={handleCompleteLogout}
                        className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                        title="Complete Logout"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                    <PWAInstallButton />
                </div>

                {/* Main Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Restaurant Name</h1>
                    <p className="text-gray-600 text-lg">Enter Your PIN</p>
                </div>

                {/* PIN Entry Container */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* PIN Display */}
                    <div className="mb-8">
                        <div className={`flex justify-center gap-3 mb-6 ${animation}`}>
                            {Array.from({ length: 4 }, (_, index) => (
                                <div
                                    key={index}
                                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                                        index < enteredPin.length
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-gray-100 border-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        
                        {/* Message Display */}
                        {message.text && (
                            <div className={`text-center font-medium ${messageColor} mb-4`}>
                                {message.text}
                            </div>
                        )}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Numbers 1-9 */}
                        {Array.from({ length: 9 }, (_, index) => {
                            const number = (index + 1).toString();
                            return (
                                <KeypadButton
                                    key={number}
                                    onClick={() => handleNumberClick(number)}
                                    className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300"
                                >
                                    {number}
                                </KeypadButton>
                            );
                        })}

                        {/* Bottom row: Clear, 0, Backspace */}
                        <KeypadButton
                            onClick={handleClear}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300"
                        >
                            C
                        </KeypadButton>

                        <KeypadButton
                            onClick={() => handleNumberClick('0')}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300"
                        >
                            0
                        </KeypadButton>

                        <KeypadButton
                            onClick={handleBackspace}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300"
                        >
                            <BackspaceIcon />
                        </KeypadButton>
                    </div>

                    {/* Debug Info - Only show staff PIN */}
                    <div className="mt-6 text-center text-xs text-gray-500">
                        <p>Staff PIN: 0000</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffPin;
