import React, { useState, useEffect, useCallback } from 'react';

interface PinProps {
  onLogin: (role: 'staff' | 'admin') => void;
}

// Helper component for individual keypad buttons
const KeypadButton = ({ onClick, children, className = '', ...props }: any) => (
    <button
        onClick={onClick}
        className={`keypad-btn text-2xl font-semibold text-gray-700 bg-gray-100 rounded-full h-16 w-16 mx-auto flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform active:scale-95 ${className}`}
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

    // Staff/admin PINs
    const staffPin = '0000';
    const adminPin = '5678';

    // Reset PIN and message
    const resetPin = useCallback((clearMessage = true) => {
        setEnteredPin('');
        if (clearMessage) {
            setMessage({ text: '', type: '' });
        }
    }, []);

    // Verify PIN and call onLogin
    const verifyPin = useCallback(() => {
        // Always log PIN verification for debugging production issues
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
        <div className="w-full max-w-xs mx-auto bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-800">Enter PIN</h1>
                <p className="text-gray-500 text-sm mt-1">Enter your 4-digit PIN to continue</p>
                <div className="mt-3 text-xs text-gray-400">
                    <p>Use your assigned PIN:</p>
                    <p>• Admin PIN for management access</p>
                    <p>• Staff PIN for task management</p>
                </div>
            </div>

            {/* PIN Display */}
            <div id="pin-display" className={`flex justify-center items-center space-x-3 mb-8 ${animation}`}>
                {[...Array(4)].map((_, index) => (
                    <div
                        key={index}
                        className={`pin-dot h-4 w-4 rounded-full transition-all duration-200 ease-in-out ${
                            index < enteredPin.length ? 'bg-indigo-500' : 'bg-gray-300'
                        }`}
                    ></div>
                ))}
            </div>

            {/* Keypad */}
            <div id="keypad" className="grid grid-cols-3 gap-4">
                {/* Render number buttons 1-9 */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <KeypadButton key={num} onClick={() => handleNumberClick(num.toString())}>
                        {num}
                    </KeypadButton>
                ))}

                {/* Clear button */}
                <KeypadButton 
                    onClick={handleClear} 
                    className="text-sm font-bold focus:ring-red-500"
                >
                    Clear
                </KeypadButton>

                {/* Zero button */}
                <KeypadButton onClick={() => handleNumberClick('0')}>0</KeypadButton>

                {/* Backspace button */}
                <KeypadButton onClick={handleBackspace} className="focus:ring-yellow-500">
                    <BackspaceIcon />
                </KeypadButton>
            </div>
            
            {/* Message Area */}
            <div className={`text-center mt-4 h-6 text-sm ${messageColor}`}>
                {message.text}
            </div>
        </div>
    );
};

export default StaffPin;
