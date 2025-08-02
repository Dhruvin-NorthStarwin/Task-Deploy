import React, { useRef, useState, useEffect } from 'react';
import { CloseIcon } from '../common/Icons';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // Default to back camera

  useEffect(() => {
    if (isOpen) {
      openCamera();
    } else {
      closeCamera();
    }
    return () => closeCamera();
  }, [isOpen, facingMode]);

  const openCamera = async () => {
    try {
      // Close existing stream before opening new one
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Please check permissions.");
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCapturedImage(null);
    }
  };

  const flipCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Capture Image</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <CloseIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
            ></video>
            {capturedImage && (
              <img 
                src={capturedImage} 
                alt="Captured task" 
                className="w-full h-full object-cover" 
              />
            )}
            
            {/* Camera Flip Button - Only show when not captured */}
            {!capturedImage && (
              <button 
                onClick={flipCamera}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                title={`Switch to ${facingMode === 'user' ? 'back' : 'front'} camera`}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        <div className="flex items-center justify-center p-4 border-t gap-4">
          {capturedImage ? (
            <>
              <button 
                onClick={() => setCapturedImage(null)} 
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Retake
              </button>
              <button 
                onClick={handleConfirm} 
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Confirm Image
              </button>
            </>
          ) : (
            <button 
              onClick={handleCapture} 
              className="px-6 py-3 rounded-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
