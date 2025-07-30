import React from 'react';
import type { Notification } from '../../types';

interface NotificationProps {
  notification: Notification | null;
}

const NotificationComponent: React.FC<NotificationProps> = ({ notification }) => {
  if (!notification) return null;

  const bgColor = notification.type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed top-5 right-5 text-white py-3 px-6 rounded-lg shadow-lg transition-opacity duration-300 z-50 ${bgColor}`}>
      <p>{notification.message}</p>
    </div>
  );
};

export default NotificationComponent;
