import React, { useState, useEffect } from 'react';
import type { Task } from '../../types';
import { CloseIcon, CameraIcon } from '../common/Icons';
import CameraModal from './CameraModal';
import VideoModal from './VideoModal';
import apiService from '../../services/apiService';

interface StaffTaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onImageCapture: (taskId: number, imageUrl: string) => void;
  onVideoCapture: (taskId: number, videoUrl: string) => void;
  onTaskSubmit: (taskId: number, initials?: string) => void;
  onInitialsUpdate?: (taskId: number, initials: string) => void;
}

const StaffTaskDetailModal: React.FC<StaffTaskDetailModalProps> = ({ 
  task, 
  onClose, 
  onImageCapture,
  onVideoCapture,
  onTaskSubmit,
  onInitialsUpdate
}) => {
  const [show, setShow] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [initials, setInitials] = useState(task?.initials || '');
  const [isSavingInitials, setIsSavingInitials] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setShow(!!task);
    setInitials(task?.initials || '');
  }, [task]);

  // Debounced save initials function
  useEffect(() => {
    if (!task || initials === task.initials) return;

    const timeoutId = setTimeout(async () => {
      try {
        setIsSavingInitials(true);
        await apiService.updateTaskInitials(task.id, initials);
        console.log('Initials saved successfully:', initials);
        // Notify parent component of the update
        if (onInitialsUpdate) {
          onInitialsUpdate(task.id, initials);
        }
      } catch (error) {
        console.error('Failed to save initials:', error);
        // Revert to original initials on error
        setInitials(task.initials || '');
      } finally {
        setIsSavingInitials(false);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [initials, task, onInitialsUpdate]);

  if (!task) return null;

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const handleCaptureAndSave = (imageDataUrl: string) => {
    onImageCapture(task.id, imageDataUrl);
    setIsCameraOpen(false);
  };

  const handleInitialsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInitials(e.target.value);
  };

  const handleSubmitWithInitials = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    console.log('🔄 MODAL SUBMIT: Starting task submission...', task?.id);
    setIsSubmitting(true);
    
    try {
      // Pass initials to parent for task submission
      await onTaskSubmit(task.id, initials);
      console.log('✅ MODAL SUBMIT: Task submission completed');
    } catch (error) {
      console.error('❌ MODAL SUBMIT: Task submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoCapture = (videoUrl: string) => {
    onVideoCapture(task.id, videoUrl);
    setShowVideoModal(false);
  };

  return (
    <>
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handleCaptureAndSave} 
      />
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onCapture={handleVideoCapture}
      />
      <div className={`fixed inset-0 z-40 flex items-center justify-center p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose}></div>
        <div className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800">{task.task}</h2>
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Task Description Section */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Task Description
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">{task.description || 'No description provided.'}</p>
            </div>

            {/* Task Status Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Current Status
              </h4>
              
              {task.status === 'Unknown' && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Ready for submission</span>
                </div>
              )}
              
              {task.status === 'Submitted' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700">Task Submitted Successfully</span>
                  </div>
                  <p className="text-xs text-blue-600">Your submission is under admin review</p>
                </div>
              )}
              
              {task.status === 'Done' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">Task Completed ✓</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">Great job! This task has been approved.</p>
                </div>
              )}
              
              {task.status === 'Declined' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-700">Task Declined</span>
                  </div>
                  {task.declineReason && (
                    <div className="bg-red-100 p-2 rounded text-xs text-red-700 mt-2">
                      <strong>Reason:</strong> {task.declineReason}
                    </div>
                  )}
                  <p className="text-xs text-red-600 mt-2">Previous media has been removed. Please capture new images/videos and resubmit.</p>
                </div>
              )}
            </div>
            {/* Initials Text Area */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Initials</label>
                {isSavingInitials && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </span>
                )}
              </div>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your initials (e.g. AB)"
                maxLength={5}
                value={initials}
                onChange={handleInitialsChange}
              />
            </div>

            {/* Media Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {task.imageRequired && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Required Image
                  </h4>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                    {task.imageUrl ? (
                      <img 
                        src={task.imageUrl} 
                        alt="Task completion" 
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg" 
                        onClick={() => setShowImagePreview(true)}
                        title="Click to view full size"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs">No Image Captured</p>
                      </div>
                    )}
                  </div>
                  {task.status !== 'Done' && (
                    <button 
                      onClick={() => setIsCameraOpen(true)} 
                      className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-900 text-white transition-colors"
                    >
                      <CameraIcon className="w-4 h-4" /> 
                      Open Camera
                    </button>
                  )}
                  {task.status === 'Done' && (
                    <div className="mt-2 text-center text-xs text-green-600 font-medium bg-green-50 py-1.5 rounded-lg">
                      Task completed - image capture disabled
                    </div>
                  )}
                </div>
              )}
              
              {task.videoRequired && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Required Video
                  </h4>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                    {task.videoUrl ? (
                      <div 
                        className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity relative group rounded-lg overflow-hidden"
                        onClick={() => setShowVideoPreview(true)}
                        title="Click to view full size"
                      >
                        <video 
                          src={task.videoUrl} 
                          className="w-full h-full object-cover" 
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all">
                          <div className="bg-white bg-opacity-90 rounded-full p-2">
                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs">No Video Recorded</p>
                      </div>
                    )}
                  </div>
                  {task.status !== 'Done' && (
                    <button 
                      onClick={() => setShowVideoModal(true)} 
                      className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Record Video
                    </button>
                  )}
                  {task.status === 'Done' && (
                    <div className="mt-2 text-center text-xs text-green-600 font-medium bg-green-50 py-1.5 rounded-lg">
                      Task completed - video recording disabled
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Fixed with Action Buttons */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl flex-shrink-0">
            {task.status === 'Unknown' && (
              <div className="space-y-2">
                {(!task.imageRequired && !task.videoRequired) ? (
                  <button 
                    onClick={handleSubmitWithInitials} 
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Complete Task'
                    )}
                  </button>
                ) : (
                  <>
                    {(task.imageRequired && !task.imageUrl) || (task.videoRequired && !task.videoUrl) ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-yellow-700 font-medium">
                          {task.imageRequired && !task.imageUrl && 'Image required'} 
                          {task.imageRequired && !task.imageUrl && task.videoRequired && !task.videoUrl && ' and '}
                          {task.videoRequired && !task.videoUrl && 'Video required'}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">Please capture all required media before submitting</p>
                      </div>
                    ) : null}
                    
                    <button 
                      onClick={handleSubmitWithInitials} 
                      disabled={isSubmitting || (task.imageRequired && !task.imageUrl) || (task.videoRequired && !task.videoUrl)}
                      className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        'Submit Task for Review'
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
            
            {task.status === 'Declined' && (
              <button 
                onClick={() => onTaskSubmit(task.id, initials)} 
                disabled={isSubmitting || (task.imageRequired && !task.imageUrl) || (task.videoRequired && !task.videoUrl)}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resubmitting...
                  </>
                ) : (
                  'Resubmit Task'
                )}
              </button>
            )}

            {(task.status === 'Submitted' || task.status === 'Done') && (
              <div className="text-center">
                <button 
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && task.imageUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-90">
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <button 
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕
            </button>
            <img 
              src={task.imageUrl} 
              alt="Task completion full size" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {showVideoPreview && task.videoUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-90">
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <button 
              onClick={() => setShowVideoPreview(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕
            </button>
            <video 
              src={task.videoUrl} 
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default StaffTaskDetailModal;
