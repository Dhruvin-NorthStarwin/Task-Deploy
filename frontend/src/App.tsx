


import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LoginComponent, NotificationComponent } from './components/LoginComponent';
import { SignupComponent } from './components/SignupComponent';
import StaffPin from './components/StaffPin';
import AdminTaskPanel from './components/admin/AdminTaskPanel';
import StaffTaskPanel from './components/staff/StaffTaskPanel';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { debugApiConfig } from './utils/debug';
import config from './config/environment';

// Create an inner component that uses the auth context
const AppContent: React.FC = () => {
  const [notification, setNotification] = useState<null | { message: string; type: 'success' | 'error' }>(null);
  const { setUserRole, logout } = useAuth();
  const navigate = useNavigate();

  // Debug API configuration on app load (only in development)
  useEffect(() => {
    if (config.DEBUG) {
      debugApiConfig();
    }
  }, []);

  const showNotification = (notif: { message: string; type: 'success' | 'error' }) => {
    setNotification(notif);
    setTimeout(() => setNotification(null), 3000);
  };

  // Handler for login success
  const handleLoginSuccess = () => {
    showNotification({ message: 'Login successful!', type: 'success' });
    navigate('/pin');
  };

  // Handler for registration success
  const handleRegistrationSuccess = () => {
    showNotification({ message: 'Registration complete! Please enter your PIN.', type: 'success' });
    navigate('/pin');
  };

  // Handler for PIN entry success
  const handlePinLogin = (role: 'staff' | 'admin') => {
    setUserRole(role);
    showNotification({ message: `${role === 'admin' ? 'Admin' : 'Staff'} access granted!`, type: 'success' });
    
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/staff');
    }
  };

  return (
    <div className="bg-stone-100">
      <div className="min-h-screen bg-stone-200 flex items-center justify-center p-4">
        <NotificationComponent notification={notification} />
        <Routes>
          <Route path="/" element={
            <LoginComponent
              onShowSignup={() => navigate('/signup')}
              onLoginSuccess={handleLoginSuccess}
              setNotification={showNotification}
            />
          } />
          <Route path="/signup" element={
            <SignupComponent
              onShowLogin={() => navigate('/')}
              onRegistrationSuccess={handleRegistrationSuccess}
              setNotification={showNotification}
            />
          } />
          <Route path="/pin" element={
            <ProtectedRoute requireAuth={true}>
              <StaffPin onLogin={handlePinLogin} />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAuth={true} requiredRole="admin" requirePin={true}>
              <AdminTaskPanel onLogout={logout} />
            </ProtectedRoute>
          } />
          <Route path="/staff" element={
            <ProtectedRoute requireAuth={true} requiredRole="staff" requirePin={true}>
              <StaffTaskPanel onLogout={logout} />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
};

// Main App wrapper component
const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
