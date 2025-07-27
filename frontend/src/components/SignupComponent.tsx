import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import config from '../config/environment';

interface Location {
  addressLine1: string;
  townCity: string;
  postcode: string;
}

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

const SignupComponent: React.FC<{ onShowLogin: () => void, onRegistrationSuccess: () => void, setNotification: (notification: Notification) => void }> = ({ onShowLogin, onRegistrationSuccess, setNotification }) => {
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [registeredCode, setRegisteredCode] = useState('');
  const [registeredStaff, setRegisteredStaff] = useState<any[]>([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [locations, setLocations] = useState<Location[]>([{ addressLine1: '', townCity: '', postcode: '' }]);
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [terms, setTerms] = useState(false);
  const { login } = useAuth();

  const handleLocationChange = (index: number, field: keyof Location, value: string) => {
    const newLocations = [...locations];
    newLocations[index][field] = value;
    setLocations(newLocations);
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
    const isLocationsValid = locations.every(l => l.addressLine1 && l.townCity && l.postcode);

    if (!restaurantName || !contactEmail || !password || !confirmPassword || !terms || !isLocationsValid) {
      setNotification({ message: 'Please fill out all fields and agree to the terms.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setNotification({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: restaurantName,
          cuisine_type: cuisineType,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          password,
          locations: locations.map(l => ({
            address_line1: l.addressLine1,
            town_city: l.townCity,
            postcode: l.postcode
          }))
        })
      });
      const data = await response.json();
      if (response.ok && data.restaurant_code) {
        setNotification({ message: 'Registration successful!', type: 'success' });
        setRegisteredCode(data.restaurant_code);
        setRegisteredStaff(data.staff || []);
        setShowCodeModal(true);
        
        // Auto-login the user after registration so they can proceed to PIN
        const loginSuccess = await login(data.restaurant_code, password);
        if (loginSuccess) {
          // Store auth info
          localStorage.setItem('login_timestamp', Date.now().toString());
          localStorage.setItem('auth_token', 'user_authenticated');
        }
      } else {
        setNotification({ message: data.message || 'Registration failed.', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Server error. Please try again later.', type: 'error' });
    }
  };

  return (
    <>
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Register Your Restaurant</h1>
            <p className="text-gray-600 mt-2">Partner with us and reach more customers across the UK.</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            {/* Form fields */}
            <div className="mb-5">
              <label htmlFor="restaurantName" className="block mb-2 text-sm font-medium text-gray-700">Restaurant Name</label>
              <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
            </div>
            <div className="mb-5">
              <label htmlFor="cuisineType" className="block mb-2 text-sm font-medium text-gray-700">Cuisine Type</label>
              <input type="text" value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
            </div>
            {/* Locations */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">Locations</label>
              <div className="space-y-4">
                {locations.map((loc, index) => (
                  <div key={index} className="location-entry p-4 border rounded-lg bg-gray-50/80 relative">
                    {locations.length > 1 && (
                      <button type="button" onClick={() => removeLocation(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
                    )}
                    <h3 className="font-semibold text-gray-700 mb-3">Location {index + 1}</h3>
                     <div className="mb-3">
                          <label className="block mb-2 text-xs font-medium text-gray-600">Address Line 1</label>
                          <input type="text" value={loc.addressLine1} onChange={e => handleLocationChange(index, 'addressLine1', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block mb-2 text-xs font-medium text-gray-600">Town/City</label>
                              <input type="text" value={loc.townCity} onChange={e => handleLocationChange(index, 'townCity', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
                          </div>
                          <div>
                              <label className="block mb-2 text-xs font-medium text-gray-600">Postcode</label>
                              <input type="text" value={loc.postcode} onChange={e => handleLocationChange(index, 'postcode', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
                          </div>
                      </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <button type="button" onClick={addLocation} className="w-full text-sky-700 bg-sky-100 hover:bg-sky-200 focus:ring-4 focus:ring-sky-300 font-bold rounded-lg text-sm px-5 py-2.5 text-center">
                + Add Another Location
              </button>
            </div>
            {/* Contact & Password Details */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Details</h2>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-700">Contact Person</label>
                <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-700">Contact Email</label>
                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-700">Contact Phone</label>
                <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
              </div>
               <div className="mb-5">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                      <input type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
                      <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <PasswordToggleIcon isVisible={isPasswordVisible} />
                      </button>
                  </div>
              </div>
              <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="relative">
                      <input type={isConfirmPasswordVisible ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
                      <button type="button" onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <PasswordToggleIcon isVisible={isConfirmPasswordVisible} />
                      </button>
                  </div>
              </div>
            </div>
            {/* Terms and Submit */}
            <div className="flex items-center mb-8">
              <input id="terms" type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500" required />
              <label htmlFor="terms" className="ml-2 text-sm font-medium text-gray-700">I agree to the <a href="#" className="text-sky-600 hover:underline">terms and conditions</a>.</label>
            </div>
            <button type="submit" className="w-full text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-300 font-bold rounded-lg text-base px-5 py-3 text-center">
              Register Restaurant
            </button>
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button type="button" onClick={onShowLogin} className="font-semibold text-sky-600 hover:underline focus:outline-none">
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold" onClick={() => { setShowCodeModal(false); onShowLogin(); }}>
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-sky-700">Registration Complete!</h2>
            <p className="mb-2 text-gray-700">Your restaurant code:</p>
            <div className="text-3xl font-mono font-bold text-green-700 mb-4">{registeredCode}</div>
            {registeredStaff.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Admin & Staff PINs:</h3>
                <ul className="list-disc pl-6">
                  {registeredStaff.map((staff, idx) => (
                    <li key={idx} className="mb-1">
                      <span className="font-bold">{staff.role === 'admin' ? 'Admin' : 'Staff'}:</span> {staff.name}
                      {staff.pin && <span className="ml-2 text-sm text-green-700 font-mono">PIN: {staff.pin}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Please save this information safely. You'll need your restaurant code to login and the PINs to access your dashboard.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowCodeModal(false); onRegistrationSuccess(); }}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Continue to PIN Entry
              </button>
              <button 
                onClick={() => { setShowCodeModal(false); onShowLogin(); }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { SignupComponent, PasswordToggleIcon };
