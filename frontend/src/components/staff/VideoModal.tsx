import React, { useRef, useState, useEffect } from 'react';
import { CloseIcon } from '../common/Icons';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (videoDataUrl: string) => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    if (isOpen) {
      openCamera();
    } else {
      closeCamera();
    }
    return () => closeCamera();
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera and microphone. Please check permissions.");
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setRecordedVideo(null);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    const newChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        newChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(newChunks, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setRecordedVideo(videoUrl);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleConfirm = () => {
    if (recordedVideo) {
      onCapture(recordedVideo);
      onClose();
    }
  };

  const handleRetake = () => {
    setRecordedVideo(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Record Video</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <CloseIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
            {/* Live Preview */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover ${recordedVideo ? 'hidden' : 'block'}`}
            ></video>
            
            {/* Recorded Video Preview */}
            {recordedVideo && (
              <video 
                ref={recordedVideoRef}
                src={recordedVideo}
                controls
                className="w-full h-full object-cover"
              />
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
              </div>
            )}

            {/* Recording Controls Overlay */}
            {!recordedVideo && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                {!isRecording ? (
                  <button 
                    onClick={startRecording} 
                    className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                  >
                    <div className="w-6 h-6 bg-white rounded-full"></div>
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording} 
                    className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                  >
                    <div className="w-6 h-6 bg-white rounded-sm"></div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center p-4 border-t gap-4">
          {recordedVideo ? (
            <>
              <button 
                onClick={handleRetake} 
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Record Again
              </button>
              <button 
                onClick={handleConfirm} 
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Confirm Video
              </button>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                {isRecording ? 'Recording in progress...' : 'Press the red button to start recording'}
              </p>
              <p className="text-xs text-gray-500">
                Maximum recording time: 60 seconds
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
