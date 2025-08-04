import React, { useState, useEffect, useRef } from 'react';
import type { Task, Status } from '../../types';
import { CloseIcon } from '../common/Icons';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onStatusChange: (taskId: number, newStatus: Status) => void;
  onTaskApprove: (taskId: number) => void;
  onTaskDecline: (taskId: number, reason: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, 
  onClose, 
  // onStatusChange, // Removed unused parameter
  onTaskApprove, 
  onTaskDecline 
}) => {
  const [show, setShow] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const declineFormRef = useRef<HTMLDivElement>(null);

  // Detect iOS for better compatibility
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    if (task) {
      setShow(true);
      // Prevent body scroll on iOS when modal is open
      if (isIOS) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      }
    } else {
      setShow(false);
      // Restore body scroll
      if (isIOS) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (isIOS) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    };
  }, [task, isIOS]);

  const handleImageClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowImagePreview(true);
  };

  const handleVideoClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowVideoPreview(true);
  };

  if (!task) return null;

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 500); // Wait for animation to finish
  };

  const handleDeclineClick = () => {
    setShowDeclineForm(true);
    // Scroll to decline form after it renders
    setTimeout(() => {
      if (declineFormRef.current) {
        declineFormRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Focus on the textarea for immediate typing
        const textarea = declineFormRef.current.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }
    }, 100);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-opacity duration-500 ios-modal-container ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className="fixed inset-0 bg-black/40 ios-modal-backdrop" onClick={handleClose}></div>
      <div className={`bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] lg:max-h-[85vh] flex flex-col transition-all duration-500 relative ios-modal-content ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate pr-3">{task.task}</h2>
          <button onClick={handleClose} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 min-h-touch min-w-touch flex items-center justify-center">
            <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Mobile Optimized Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 ios-modal-scroll ios-no-bounce">
          {/* Task Description Section */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Task Description
            </h4>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{task.description || 'No description provided.'}</p>
          </div>

          {/* Task Status Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Current Status
            </h4>
            
            {task.status === 'Unknown' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Waiting for Staff Submission</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Task has been assigned but not yet submitted by staff</p>
              </div>
            )}
            
            {task.status === 'Submitted' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-blue-700">Task Submitted - Ready for Review</span>
                </div>
                <p className="text-xs sm:text-sm text-blue-600">Staff has submitted this task and it's waiting for your review</p>
              </div>
            )}
            
            {task.status === 'Done' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium text-green-700">Task Approved & Completed ✓</span>
                </div>
                <p className="text-xs sm:text-sm text-green-600 mt-1">This task has been reviewed and approved</p>
              </div>
            )}
            
            {task.status === 'Declined' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium text-red-700">Task Declined</span>
                </div>
                <p className="text-xs sm:text-sm text-red-600">Task was declined and is waiting for staff resubmission</p>
              </div>
            )}
          </div>

          {/* Submitted Media Section - Mobile First */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {(task.imageRequired || task.imageUrl) && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Task Image
                </h4>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                  {task.imageUrl ? (
                    <img 
                      src={task.imageUrl} 
                      alt="Task submission" 
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg ios-image-fix ios-touch-fix" 
                      onClick={handleImageClick}
                      onTouchEnd={handleImageClick}
                      title="Click to view full size"
                      style={{ touchAction: 'manipulation' }}
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs">
                        {task.status === 'Unknown' ? 'Waiting for submission' : 'No image submitted'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {(task.videoRequired || task.videoUrl) && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Task Video
                </h4>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                  {task.videoUrl ? (
                    <div 
                      className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity relative group rounded-lg overflow-hidden ios-touch-fix"
                      onClick={handleVideoClick}
                      onTouchEnd={handleVideoClick}
                      title="Click to view full size"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <video 
                        src={task.videoUrl} 
                        className="w-full h-full object-cover ios-video-fix" 
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all">
                        <div className="bg-white bg-opacity-90 rounded-full p-2">
                          <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs">
                        {task.status === 'Unknown' ? 'Waiting for submission' : 'No video submitted'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Decline Form Section */}
          {showDeclineForm && (
            <div ref={declineFormRef} className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Decline Task
              </h4>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please provide a reason for declining this task..."
                className="w-full p-2 border border-red-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Footer - Mobile Optimized Action Buttons */}
        <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50 rounded-b-lg sm:rounded-b-xl flex-shrink-0">
          {task.status === 'Submitted' && (
            <div className="space-y-2 sm:space-y-3">
              {!showDeclineForm ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => onTaskApprove(task.id)} 
                    className="w-full sm:flex-1 px-4 py-3 sm:py-2.5 text-sm sm:text-base font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg min-h-touch"
                  >
                    ✓ Approve Task
                  </button>
                  <button 
                    onClick={handleDeclineClick} 
                    className="w-full sm:flex-1 px-4 py-3 sm:py-2.5 text-sm sm:text-base font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg min-h-touch"
                  >
                    ✗ Decline Task
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => {
                      if (declineReason.trim()) {
                        onTaskDecline(task.id, declineReason);
                        setShowDeclineForm(false);
                        setDeclineReason('');
                      }
                    }} 
                    className="w-full sm:flex-1 px-4 py-3 sm:py-2.5 text-sm sm:text-base font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg min-h-touch"
                    disabled={!declineReason.trim()}
                  >
                    Submit Decline
                  </button>
                  <button 
                    onClick={() => {
                      setShowDeclineForm(false);
                      setDeclineReason('');
                    }} 
                    className="w-full sm:w-auto px-4 py-3 sm:py-2.5 text-sm sm:text-base font-semibold rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors min-h-touch"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {(task.status === 'Unknown' || task.status === 'Done' || task.status === 'Declined') && (
            <div className="text-center">
              <button 
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 text-sm sm:text-base font-medium text-gray-600 hover:text-gray-800 transition-colors min-h-touch"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && task.imageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <button 
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
              style={{ zIndex: 1 }}
            >
              ✕
            </button>
            <img 
              src={task.imageUrl} 
              alt="Task submission full size" 
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            />
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {showVideoPreview && task.videoUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <button 
              onClick={() => setShowVideoPreview(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
              style={{ zIndex: 1 }}
            >
              ✕
            </button>
            <video 
              src={task.videoUrl} 
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailModal;
