import React, { useState, useEffect } from 'react';
import { getStorageStatus } from '../../utils/iosStorage';

interface StorageStatus {
  localStorage: boolean;
  indexedDB: boolean;
  memoryCache: number;
  cookiesEnabled: boolean;
}

const IOSStorageDebug: React.FC = () => {
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    if (isIOS) {
      const status = getStorageStatus() as StorageStatus;
      setStorageStatus(status);
    }
  }, [isIOS]);

  if (!isIOS) return null;

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="text-blue-600 flex-shrink-0">
          <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            📱 iOS Device Detected - Enhanced Storage Active
          </h3>
          
          <div className="text-sm text-blue-700 mb-3">
            <p className="mb-2">
              ✅ Using iOS-compatible storage methods for better reliability on your device.
            </p>
            
            {storageStatus && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-1 rounded ${storageStatus.localStorage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  localStorage: {storageStatus.localStorage ? 'Available' : 'Blocked'}
                </span>
                <span className={`px-2 py-1 rounded ${storageStatus.indexedDB ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  IndexedDB: {storageStatus.indexedDB ? 'Available' : 'Limited'}
                </span>
                <span className={`px-2 py-1 rounded ${storageStatus.cookiesEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  Cookies: {storageStatus.cookiesEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                  Memory: Active
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-blue-600 hover:text-blue-700 underline"
          >
            {showDebug ? 'Hide' : 'Show'} technical details
          </button>
          
          {showDebug && storageStatus && (
            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
              <h4 className="text-xs font-medium text-blue-800 mb-2">Storage Methods Status:</h4>
              <div className="text-xs text-blue-700 space-y-1 font-mono">
                <div>• localStorage: {storageStatus.localStorage ? '✅ Working' : '❌ Blocked (likely Private Mode)'}</div>
                <div>• IndexedDB: {storageStatus.indexedDB ? '✅ Available' : '⚠️ Not supported'}</div>
                <div>• Cookies: {storageStatus.cookiesEnabled ? '✅ Enabled' : '❌ Disabled'}</div>
                <div>• Memory Cache: ✅ Active ({storageStatus.memoryCache} items)</div>
                <div>• Platform: {navigator.platform}</div>
                <div>• User Agent: {navigator.userAgent.substring(0, 60)}...</div>
              </div>
              
              <div className="mt-2 p-2 bg-blue-200 rounded text-xs text-blue-800">
                <strong>How it works:</strong> The app automatically uses the best available storage method. 
                If localStorage is blocked, it falls back to IndexedDB, then cookies, with memory cache as backup.
              </div>
            </div>
          )}
          
          {storageStatus && !storageStatus.localStorage && (
            <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <div className="text-sm text-yellow-800">
                <strong>💡 Tip:</strong> If you're using Safari Private Mode, consider switching to regular mode for better performance.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IOSStorageDebug;
