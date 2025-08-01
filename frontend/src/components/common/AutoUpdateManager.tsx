import React, { useEffect, useState } from 'react';

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl shadow-2xl border border-green-500 z-50">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1">Update Available</h4>
          <p className="text-xs text-green-100 mb-3 leading-relaxed">
            A new version of RestroManage is ready! Click update to get the latest features and improvements.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onUpdate}
              className="bg-white text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-50 transition-colors shadow-sm"
            >
              Update Now
            </button>
            <button
              onClick={onDismiss}
              className="bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-opacity-30 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-green-200 hover:text-white transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const AutoUpdateManager: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Only run in browsers that support service workers
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker and handle updates
    const registerSW = async () => {
      try {
        const swRegistration = await navigator.serviceWorker.register('/sw.js');
        setRegistration(swRegistration);
        
        console.log('PWA: Service Worker registered successfully');

        // Check for updates immediately
        await swRegistration.update();

        // Listen for service worker updates
        swRegistration.addEventListener('updatefound', () => {
          const newWorker = swRegistration.installing;
          
          if (newWorker) {
            console.log('PWA: New service worker found, installing...');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                console.log('PWA: New content available, will update on next refresh');
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATED') {
            console.log('PWA: Service worker updated:', event.data.message);
            // Optional: Show a different notification for automatic updates
          }
        });

        // Check for waiting service worker
        if (swRegistration.waiting) {
          setUpdateAvailable(true);
        }

        // Periodic update checks (every 60 seconds)
        const checkForUpdates = async () => {
          try {
            await swRegistration.update();
          } catch (error) {
            console.log('PWA: Update check failed:', error);
          }
        };

        // Check for updates every minute when app is active
        const updateInterval = setInterval(checkForUpdates, 60000);

        // Check for updates when app becomes visible
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            checkForUpdates();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
          clearInterval(updateInterval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };

      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting and activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to apply the update
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  return (
    <>
      {updateAvailable && (
        <UpdateNotification onUpdate={handleUpdate} onDismiss={handleDismiss} />
      )}
    </>
  );
};

export default AutoUpdateManager;
