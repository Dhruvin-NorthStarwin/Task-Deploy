import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const installed = isStandalone || isInWebAppiOS;
      setIsInstalled(installed);
      
      console.log('PWA Install Status:', { isStandalone, isInWebAppiOS, installed });
    };

    // Check if iOS
    const checkIfIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
    };

    checkIfInstalled();
    checkIfIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      console.log('PWA: No install prompt available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA: Install failed:', error);
    }
  };

  // Show button in more scenarios for better UX
  // Only hide if definitely installed and not in a situation where we should show it
  const shouldShow = deferredPrompt || isIOS || !isInstalled;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium border border-blue-500 hover:border-blue-600"
        title="Install RestroManage App"
      >
        <div className="w-5 h-5 bg-white bg-opacity-20 rounded flex items-center justify-center text-xs font-bold">
          📱
        </div>
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* iOS Installation Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white flex items-center justify-center text-lg font-bold shadow-lg">
                📱
              </div>
              <h3 className="text-xl font-bold text-gray-900">Install RestroManage</h3>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              To install this app on your iOS device and use it like a native app:
            </p>
            
            <ol className="text-sm text-gray-700 space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">1</span>
                <div>
                  <span className="font-semibold">Tap the Share button</span>
                  <div className="text-xs text-gray-500 mt-1">Look for the square with an arrow pointing up in Safari's toolbar</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">2</span>
                <div>
                  <span className="font-semibold">Find "Add to Home Screen"</span>
                  <div className="text-xs text-gray-500 mt-1">Scroll down in the options menu</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">3</span>
                <div>
                  <span className="font-semibold">Tap "Add" to install</span>
                  <div className="text-xs text-gray-500 mt-1">The app will appear on your home screen</div>
                </div>
              </li>
            </ol>
            
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;
