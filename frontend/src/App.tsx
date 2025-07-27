


import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LoginComponent, NotificationComponent } from './components/LoginComponent';
import { SignupComponent } from './components/SignupComponent';
import StaffPin from './components/StaffPin';
import AdminTaskPanel from './components/admin/AdminTaskPanel';
import StaffTaskPanel from './components/staff/StaffTaskPanel';

const App: React.FC = () => {
  const [notification, setNotification] = useState<null | { message: string; type: 'success' | 'error' }>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingRole, setPendingRole] = useState<'staff' | 'admin' | null>(null);
  const navigate = useNavigate ? useNavigate() : null;

  const showNotification = (notif: { message: string; type: 'success' | 'error' }) => {
    setNotification(notif);
    setTimeout(() => setNotification(null), 3000);
  };

  // Handler for login success
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    showNotification({ message: 'Login successful!', type: 'success' });
    if (navigate) navigate('/pin');
    // fallback for non-router context
    window.location.pathname = '/pin';
  };

  // Handler for PIN entry success
  const handlePinLogin = (role: 'staff' | 'admin') => {
    setPendingRole(role);
    if (role === 'admin') {
      if (navigate) navigate('/admin');
      window.location.pathname = '/admin';
    } else {
      if (navigate) navigate('/staff');
      window.location.pathname = '/staff';
    }
  };

  return (
    <div className="bg-stone-100">
      <div className="min-h-screen bg-stone-200 flex items-center justify-center p-4">
        <NotificationComponent notification={notification} />
        <Routes>
          <Route path="/" element={
            <LoginComponent
              onShowSignup={() => navigate ? navigate('/signup') : setIsLoggedIn(false)}
              onLoginSuccess={handleLoginSuccess}
              setNotification={showNotification}
            />
          } />
          <Route path="/signup" element={
            <SignupComponent
              onShowLogin={() => navigate ? navigate('/') : setIsLoggedIn(false)}
              setNotification={showNotification}
            />
          } />
          <Route path="/pin" element={
            <StaffPin onLogin={handlePinLogin} />
          } />
          <Route path="/admin" element={<AdminTaskPanel onLogout={() => navigate ? navigate('/') : setIsLoggedIn(false)} />} />
          <Route path="/staff" element={<StaffTaskPanel onLogout={() => navigate ? navigate('/') : setIsLoggedIn(false)} />} />
        </Routes>
      </div>
    </div>
  );
};

const AppWithRouter: React.FC = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default AppWithRouter;
