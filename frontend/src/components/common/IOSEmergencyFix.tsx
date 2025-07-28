import React, { useState } from 'react';
import config from '../../config/environment';

const IOSEmergencyFix: React.FC = () => {
  const [isTestingFix, setIsTestingFix] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);
  
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  if (!isIOS) return null;

  const tryEmergencyFix = async () => {
    setIsTestingFix(true);
    setFixResult(null);
    
    try {
      // 1. Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Force reload service worker cache
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // 3. Test direct API connection with different approaches
      const apiUrl = config.API_BASE_URL.replace('http://', 'https://');
      
      // Method 1: Simple fetch
      try {
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          setFixResult('✅ Direct API connection successful! Try logging in now.');
          return;
        }
      } catch (e) {
        console.log('Method 1 failed:', e);
      }
      
      // Method 2: With XMLHttpRequest (iOS fallback)
      try {
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `${apiUrl}/health`);
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.onload = () => resolve(xhr.response);
          xhr.onerror = reject;
          xhr.send();
        });
        
        setFixResult('✅ XMLHttpRequest connection successful! Try logging in now.');
        return;
      } catch (e) {
        console.log('Method 2 failed:', e);
      }
      
      setFixResult('❌ Connection failed. Please check your internet connection and try the manual steps below.');
      
    } catch (error) {
      setFixResult(`❌ Emergency fix failed: ${error}`);
    } finally {
      setIsTestingFix(false);
    }
  };

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="text-red-600 flex-shrink-0">
          <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            🍎 iOS Emergency Fix
          </h3>
          
          <p className="text-sm text-red-700 mb-3">
            iOS device detected. If login isn't working, try this emergency fix:
          </p>
          
          {fixResult && (
            <div className={`mb-3 p-3 rounded-lg ${fixResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <p className="text-sm">{fixResult}</p>
            </div>
          )}
          
          <button
            onClick={tryEmergencyFix}
            disabled={isTestingFix}
            className="mb-3 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isTestingFix ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Fixing...
              </>
            ) : (
              '🔧 Try Emergency Fix'
            )}
          </button>
          
          <div className="text-xs text-red-700 space-y-1">
            <p className="font-medium">Manual Steps if button doesn't work:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Close Safari completely (double-tap home, swipe up)</li>
              <li>Settings → Safari → Clear History and Website Data</li>
              <li>Turn off Private Mode (if enabled)</li>
              <li>Try using Chrome or Firefox app instead</li>
              <li>Switch from WiFi to cellular data (or vice versa)</li>
              <li>Restart your iOS device</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOSEmergencyFix;
