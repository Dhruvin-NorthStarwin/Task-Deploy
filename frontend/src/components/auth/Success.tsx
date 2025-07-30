import React from 'react';

interface SuccessProps {
  restaurantCode: string;
  onBackToLogin: () => void;
}

const SuccessComponent: React.FC<SuccessProps> = ({ restaurantCode, onBackToLogin }) => {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-green-600">Registration Successful!</h1>
        <p className="text-gray-600 mt-2 mb-6">Here are your important details. Please save them securely.</p>
        <div className="space-y-4 text-left bg-stone-50 p-6 rounded-lg border">
          <div>
            <label className="block text-sm font-medium text-gray-500">Your Restaurant Code</label>
            <p className="text-xl font-bold text-gray-800 tracking-wider">{restaurantCode}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Default Staff PIN</label>
            <p className="text-xl font-bold text-gray-800 tracking-wider">0000</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Default Admin PIN</label>
            <p className="text-xl font-bold text-gray-800 tracking-wider">5678</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBackToLogin}
          className="mt-8 w-full text-white bg-sky-600 hover:bg-sky-700 font-bold rounded-lg text-base px-5 py-3 text-center"
        >
          Proceed to Login
        </button>
      </div>
    </div>
  );
};

export default SuccessComponent;
