import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './NFCCleaningPage.css';

interface CleaningStats {
  today_count: number;
  total_entries: number;
  last_cleaned: string;
}

interface CleaningEntry {
  id: number;
  staff_name: string;
  completed_at: string;
  method: string;
  notes?: string;
}

interface NFCResponse {
  success: boolean;
  message: string;
  asset_id: string;
  restaurant_id: number;
  restaurant_name: string;
  log_id: number;
  completed_at: string;
  cleaning_stats: CleaningStats;
  recent_cleanings: CleaningEntry[];
}

const NFCCleaningPage: React.FC = () => {
  const { restaurantCode, assetId } = useParams<{ restaurantCode: string; assetId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [showTickAnimation, setShowTickAnimation] = useState(false);
  const [completionData, setCompletionData] = useState<NFCResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [staffName, setStaffName] = useState('');

  useEffect(() => {
    completeCleaningTask();
  }, [restaurantCode, assetId]);

  const completeCleaningTask = async () => {
    if (!restaurantCode || !assetId) {
      setError('Invalid NFC URL: Missing restaurant code or asset ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get staff name from localStorage or prompt
      const savedStaffName = localStorage.getItem('staff_name') || '';
      const currentStaffName = savedStaffName || 'Anonymous Staff';
      setStaffName(currentStaffName);

      const token = localStorage.getItem('authToken');
      
      // Ensure we always use the full backend URL in production
      let apiUrl;
      if (window.location.origin === 'https://task-module.up.railway.app' || 
          window.location.hostname.includes('railway.app')) {
        // Production: use full backend URL
        apiUrl = `https://radiant-amazement-production-d68f.up.railway.app/api/nfc/clean/${restaurantCode}/${assetId}`;
      } else {
        // Development: use relative URL (Vite proxy)
        apiUrl = `/api/nfc/clean/${restaurantCode}/${assetId}`;
      }
      
      // Debug logging for production troubleshooting
      console.log('🔍 NFC API URL:', apiUrl);
      console.log('🔍 Window origin:', window.location.origin);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: NFC endpoint is public, no auth required
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          staff_name: currentStaffName,
          notes: `Completed via NFC at ${new Date().toLocaleTimeString()}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete cleaning task');
      }

      const data: NFCResponse = await response.json();
      setCompletionData(data);
      
      // Show success animation after a short delay
      setTimeout(() => {
        setShowTickAnimation(true);
        // Haptic feedback for mobile
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }, 500);

    } catch (err) {
      console.error('Error completing cleaning task:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatAssetName = (assetId: string) => {
    return assetId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center animate-fade-in">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Processing NFC Tap...
          </h2>
          <p className="text-gray-600">
            Completing cleaning task for {formatAssetName(assetId || '')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full animate-fade-in">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error Completing Task
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={completeCleaningTask}
              className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto p-4 max-w-md">
        {/* Success Animation */}
        {showTickAnimation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-8 rounded-full shadow-2xl animate-bounce-in">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-tick">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`space-y-6 transition-all duration-500 ${showTickAnimation ? 'opacity-30' : 'opacity-100'}`}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              NFC Cleaning Complete
            </h1>
          </div>

          {completionData && (
            <>
              {/* Success Card */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-200 animate-slide-up">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">
                    {completionData.message}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Completed by {staffName} at {formatTime(completionData.completed_at)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Restaurant: {completionData.restaurant_name} (ID: {completionData.restaurant_id})
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <svg className="w-6 h-6 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    <div className="text-2xl font-bold text-blue-700">
                      {completionData.cleaning_stats.today_count}
                    </div>
                    <div className="text-sm text-blue-600">Times Today</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl text-center">
                    <svg className="w-6 h-6 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="12" y1="20" x2="12" y2="10"></line>
                      <line x1="18" y1="20" x2="18" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="16"></line>
                    </svg>
                    <div className="text-2xl font-bold text-purple-700">
                      {completionData.cleaning_stats.total_entries}
                    </div>
                    <div className="text-sm text-purple-600">Total Logs</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-2xl shadow-lg animate-slide-up" style={{animationDelay: '0.2s'}}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                  </svg>
                  Recent Activity
                </h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {completionData.recent_cleanings.slice(0, 5).map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-slide-up"
                      style={{animationDelay: `${0.3 + index * 0.1}s`}}
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {entry.staff_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.method} • {formatDate(entry.completed_at)}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {formatTime(entry.completed_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 animate-slide-up" style={{animationDelay: '0.4s'}}>
                <button
                  onClick={() => setShowLogs(true)}
                  className="w-full bg-blue-500 text-white py-4 rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="12" y1="20" x2="12" y2="10"></line>
                    <line x1="18" y1="20" x2="18" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="16"></line>
                  </svg>
                  View Cleaning Logs
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cleaning Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Cleaning Logs
                </h3>
                <button
                  onClick={() => setShowLogs(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatAssetName(assetId || '')}
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-3">
                {completionData?.recent_cleanings.map((entry) => (
                  <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-800">
                        {entry.staff_name}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {formatTime(entry.completed_at)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(entry.completed_at)} • {entry.method}
                    </div>
                    {entry.notes && (
                      <div className="text-xs text-gray-500 mt-2 italic">
                        "{entry.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFCCleaningPage;
