import React, { useState } from 'react';
import ReactPlayer from 'react-player';

interface VideoPreviewProps {
  videoUrl: string;
  width?: string | number;
  height?: string | number;
  controls?: boolean;
  autoplay?: boolean;
  poster?: string;
  className?: string;
  onError?: (error: any) => void;
  onReady?: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  width = "100%",
  height = "100%",
  controls = true,
  autoplay = false,
  poster,
  className = "",
  onError,
  onReady
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleReady = () => {
    setIsLoading(false);
    onReady?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    console.error('Video player error:', error);
    onError?.(error);
  };

  if (!videoUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-gray-500 text-center">
          <div className="text-2xl mb-2">📹</div>
          <div>No video available</div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-red-600 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div>Error loading video</div>
          <button 
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const playerProps = {
    url: videoUrl,
    width,
    height,
    controls,
    playing: autoplay,
    light: poster,
    onReady: handleReady,
    onError: handleError,
    style: {
      borderRadius: '8px',
      overflow: 'hidden'
    }
  };

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-gray-500 text-center">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <div>Loading video...</div>
          </div>
        </div>
      )}
      
      <ReactPlayer {...playerProps} />
    </div>
  );
};

export default VideoPreview;
