import React, { useState, useEffect } from 'react';
import VideoPreview from '../common/VideoPreview';
import { getTaskVideoUrl } from '../../services/apiService';

interface TaskVideoPlayerProps {
  taskId: number;
  width?: string | number;
  height?: string | number;
  controls?: boolean;
  autoplay?: boolean;
  className?: string;
  onVideoError?: (error: any) => void;
  onVideoReady?: () => void;
}

/**
 * TaskVideoPlayer - A component that fetches and displays video from the database for a specific task
 * 
 * Usage:
 * <TaskVideoPlayer 
 *   taskId={123} 
 *   width="100%" 
 *   height="300px" 
 *   controls={true}
 *   onVideoError={(error) => console.error('Video error:', error)}
 * />
 */
const TaskVideoPlayer: React.FC<TaskVideoPlayerProps> = ({
  taskId,
  width = "100%",
  height = "300px",
  controls = true,
  autoplay = false,
  className = "",
  onVideoError,
  onVideoReady
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const url = await getTaskVideoUrl(taskId);
        
        if (url) {
          setVideoUrl(url);
        } else {
          setError('No video found for this task');
        }
      } catch (err) {
        console.error('Error fetching video URL:', err);
        setError('Failed to load video');
        onVideoError?.(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      fetchVideo();
    }
  }, [taskId, onVideoError]);

  const handleVideoReady = () => {
    onVideoReady?.();
  };

  const handleVideoError = (error: any) => {
    setError('Error playing video');
    onVideoError?.(error);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-gray-500 text-center">
          <div className="animate-spin text-2xl mb-2">⏳</div>
          <div>Loading video...</div>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-gray-500 text-center">
          <div className="text-2xl mb-2">📹</div>
          <div className="text-sm">{error || 'No video available'}</div>
          {error && (
            <button 
              onClick={() => {
                setError(null);
                setIsLoading(true);
                // Re-trigger the effect by incrementing a counter
                window.location.reload();
              }}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <VideoPreview
      videoUrl={videoUrl}
      width={width}
      height={height}
      controls={controls}
      autoplay={autoplay}
      className={className}
      onError={handleVideoError}
      onReady={handleVideoReady}
    />
  );
};

export default TaskVideoPlayer;
