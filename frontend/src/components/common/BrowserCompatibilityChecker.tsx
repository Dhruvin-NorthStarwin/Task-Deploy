import React, { useState, useEffect } from 'react';

interface BrowserInfo {
  isIOS: boolean;
  isSafari: boolean;
  isMac: boolean;
  isPrivateMode: boolean | null;
  localStorageAvailable: boolean;
  userAgent: string;
  platform: string;
  cookieEnabled: boolean;
}

const BrowserCompatibilityChecker: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkBrowserCompatibility = async () => {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      
      // Detect iOS
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Detect Safari
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      
      // Detect Mac
      const isMac = platform.indexOf('Mac') > -1;
      
      // Check localStorage availability
      let localStorageAvailable = true;
      try {
        const testKey = 'test_storage_' + Date.now();
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      } catch (e) {
        localStorageAvailable = false;
      }
      
      // Check for private mode (Safari specific)
      let isPrivateMode: boolean | null = null;
      if (isSafari) {
        try {
          // In Safari private mode, localStorage exists but setItem throws
          localStorage.setItem('private_mode_test', '1');
          localStorage.removeItem('private_mode_test');
          isPrivateMode = false;
        } catch (e) {
          isPrivateMode = true;
        }
      }
      
      setBrowserInfo({
        isIOS,
        isSafari,
        isMac,
        isPrivateMode,
        localStorageAvailable,
        userAgent,
        platform,
        cookieEnabled: navigator.cookieEnabled
      });
    };

    checkBrowserCompatibility();
  }, []);

  if (!browserInfo) {
    return null;
  }

  // Show warning for problematic configurations
  const hasIssues = !browserInfo.localStorageAvailable || 
                   browserInfo.isPrivateMode === true;

  if (!hasIssues) {
    return null; // Don't show if everything is fine
  }

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="text-yellow-600 flex-shrink-0">
          <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">
            Browser Compatibility Issue Detected
          </h3>
          
          {browserInfo.isPrivateMode && (
            <div className="mb-3 p-3 bg-yellow-100 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                🔒 Private Mode Detected
              </p>
              <p className="text-sm text-yellow-700">
                Safari's Private Mode blocks local storage. Please disable Private Mode to continue.
              </p>
            </div>
          )}
          
          {!browserInfo.localStorageAvailable && !browserInfo.isPrivateMode && (
            <div className="mb-3 p-3 bg-yellow-100 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                💾 Storage Unavailable
              </p>
              <p className="text-sm text-yellow-700">
                Browser storage is disabled. Please check your browser settings.
              </p>
            </div>
          )}
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-yellow-700 hover:text-yellow-800 underline"
          >
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>
          
          {showDetails && (
            <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Browser Information:</h4>
              <div className="text-xs text-yellow-700 space-y-1 font-mono">
                <div>Platform: {browserInfo.platform}</div>
                <div>iOS Device: {browserInfo.isIOS ? 'Yes' : 'No'}</div>
                <div>Safari Browser: {browserInfo.isSafari ? 'Yes' : 'No'}</div>
                <div>Mac Computer: {browserInfo.isMac ? 'Yes' : 'No'}</div>
                <div>Cookies Enabled: {browserInfo.cookieEnabled ? 'Yes' : 'No'}</div>
                <div>Storage Available: {browserInfo.localStorageAvailable ? 'Yes' : 'No'}</div>
                {browserInfo.isPrivateMode !== null && (
                  <div>Private Mode: {browserInfo.isPrivateMode ? 'Yes' : 'No'}</div>
                )}
              </div>
            </div>
          )}
          
          {(browserInfo.isIOS || browserInfo.isSafari) && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">
                💡 iOS/Safari Tips:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Disable Private Mode in Safari</li>
                <li>Enable "Prevent Cross-Site Tracking" if needed</li>
                <li>Clear Safari cache and try again</li>
                <li>Try using Chrome or Firefox as alternative</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowserCompatibilityChecker;
