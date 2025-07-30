import React, { useState } from 'react';
import type { Notification } from '../../types';

interface PinEntryProps {
  onPinSuccess: (pin: string) => void;
  onLogout: () => void;
  setNotification: (notification: Notification) => void;
}

const PinEntryComponent: React.FC<PinEntryProps> = ({ onPinSuccess, onLogout, setNotification }) => {
  const [pin, setPin] = useState('');

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) {
      setPin(pin + key);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleVerify = () => {
    if (pin === '0000' || pin === '5678') {
      setNotification({ message: 'PIN Verified!', type: 'success' });
      setTimeout(() => onPinSuccess(pin), 1000);
    } else {
      setNotification({ message: 'Incorrect PIN.', type: 'error' });
      setPin('');
    }
  };

  const renderPinDisplay = () => {
    const display = [];
    for (let i = 0; i < 4; i++) {
      display.push(i < pin.length ? '*' : '-');
    }
    return display.join(' ');
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Enter Staff PIN</h1>
        <div className="my-6 h-12 flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-4xl font-mono tracking-[0.5em] text-gray-700">
            {renderPinDisplay()}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {'123456789'.split('').map(key => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="py-4 bg-gray-200 rounded-lg text-xl font-bold hover:bg-sky-200 transition-colors"
            >
              {key}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="py-4 bg-gray-200 rounded-lg text-xl font-bold hover:bg-red-200 transition-colors"
          >
            ⌫
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="py-4 bg-gray-200 rounded-lg text-xl font-bold hover:bg-sky-200 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleVerify}
            className="py-4 bg-green-500 text-white rounded-lg text-xl font-bold hover:bg-green-600 transition-colors"
          >
            ✓
          </button>
        </div>
        <div className="mt-6 border-t pt-4 text-sm text-gray-500">
          <p><span className="font-semibold">Staff PIN:</span> 0000</p>
          <p><span className="font-semibold">Admin PIN:</span> 5678</p>
        </div>
        <button
          onClick={onLogout}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default PinEntryComponent;
