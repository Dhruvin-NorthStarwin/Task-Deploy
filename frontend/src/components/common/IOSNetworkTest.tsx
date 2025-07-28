import React, { useState, useEffect } from 'react';
import config from '../../config/environment';

interface NetworkTestResult {
  canReachAPI: boolean;
  responseTime: number;
  error?: string;
  isIOS: boolean;
  userAgent: string;
}

const IOSNetworkTest: React.FC = () => {
  const [testResult, setTestResult] = useState<NetworkTestResult | null>(null);
  const [isTestingNetwork, setIsTestingNetwork] = useState(false);
  const [showTest, setShowTest] = useState(false);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    // Only show for iOS devices initially
    if (isIOS) {
      setShowTest(true);
    }
  }, [isIOS]);

  const testNetworkConnection = async () => {
    setIsTestingNetwork(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        // Add signal for timeout
        signal: AbortSignal.timeout(15000)
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      setTestResult({
        canReachAPI: response.ok,
        responseTime,
        isIOS,
        userAgent: navigator.userAgent,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      });
      
    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      setTestResult({
        canReachAPI: false,
        responseTime,
        isIOS,
        userAgent: navigator.userAgent,
        error: error.message || 'Network request failed'
      });
    } finally {
      setIsTestingNetwork(false);
    }
  };

  if (!showTest && !isIOS) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="text-blue-600 flex-shrink-0">
          <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            Network Connectivity Test
          </h3>
          
          {!testResult ? (
            <p className="text-sm text-blue-700 mb-3">
              {isIOS ? 'iOS device detected. ' : ''}Test your connection to the server to diagnose any issues.
            </p>
          ) : (
            <div className="mb-3">
              <div className={`p-3 rounded-lg ${testResult.canReachAPI ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'}`}>
                <div className={`text-sm font-medium ${testResult.canReachAPI ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.canReachAPI ? '✅ Connection Successful' : '❌ Connection Failed'}
                </div>
                <div className="text-xs mt-1 space-y-1">
                  <div>Response Time: {testResult.responseTime}ms</div>
                  <div>Device: {testResult.isIOS ? 'iOS Device' : 'Non-iOS Device'}</div>
                  {testResult.error && (
                    <div className="text-red-700">Error: {testResult.error}</div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={testNetworkConnection}
            disabled={isTestingNetwork}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isTestingNetwork ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </button>
          
          {!isIOS && (
            <button
              onClick={() => setShowTest(false)}
              className="ml-2 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Hide
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IOSNetworkTest;
