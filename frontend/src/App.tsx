


import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LoginComponent, NotificationComponent } from './components/LoginComponent';
import { SignupComponent } from './components/SignupComponent';
import StaffPin from './components/StaffPin';
import AdminTaskPanel from './components/admin/AdminTaskPanel';
import StaffTaskPanel from './components/staff/StaffTaskPanel';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

const App: React.FC = () => {
  const [notification, setNotification] = useState<null | { message: string; type: 'success' | 'error' }>(null);
  const { setUserRole, logout } = useAuth();
  const navigate = useNavigate ? useNavigate() : null;

  const showNotification = (notif: { message: string; type: 'success' | 'error' }) => {
    setNotification(notif);
    setTimeout(() => setNotification(null), 3000);
  };

  // Handler for login success
  const handleLoginSuccess = () => {
    showNotification({ message: 'Login successful!', type: 'success' });
    if (navigate) navigate('/pin');
    // fallback for non-router context
    window.location.pathname = '/pin';
  };

  // Handler for PIN entry success
  const handlePinLogin = (role: 'staff' | 'admin') => {
    setUserRole(role);
    if (role === 'admin') {
      if (navigate) navigate('/admin');
      window.location.pathname = '/admin';
    } else {
      if (navigate) navigate('/staff');
      window.location.pathname = '/staff';
    }
  };

  // Handler for logout
  const handleLogout = () => {
    logout();
    if (navigate) navigate('/');
    window.location.pathname = '/';
  };

  return (
    <div className="bg-stone-100">
      <div className="min-h-screen bg-stone-200 flex items-center justify-center p-4">
        <NotificationComponent notification={notification} />
        <Routes>
          <Route path="/" element={
            <LoginComponent
              onShowSignup={() => navigate ? navigate('/signup') : window.location.pathname = '/signup'}
              onLoginSuccess={handleLoginSuccess}
              setNotification={showNotification}
            />
          } />
          <Route path="/signup" element={
            <SignupComponent
              onShowLogin={() => navigate ? navigate('/') : window.location.pathname = '/'}
              setNotification={showNotification}
            />
          } />
          <Route path="/pin" element={
            <ProtectedRoute requireAuth={true}>
              <StaffPin onLogin={handlePinLogin} />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAuth={true} requiredRole="admin">
              <AdminTaskPanel onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/staff" element={
            <ProtectedRoute requireAuth={true} requiredRole="staff">
              <StaffTaskPanel onLogout={handleLogout} />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
};

const AppWithRouter: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

export default AppWithRouter;
