import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Day, Category, Status } from '../../types';
import { CATEGORIES, DAYS } from '../../data/tasks';
import StatusBadge from '../common/StatusBadge';
import StaffTaskDetailModal from './StaffTaskDetailModal';
import PWAInstallButton from '../common/PWAInstallButton';
import apiService from '../../services/apiService';

interface StaffTaskPanelProps {
  onLogout: () => void;
}

const StaffTaskPanel: React.FC<StaffTaskPanelProps> = ({ onLogout }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]); // Start with empty tasks
  const [activeView, setActiveView] = useState<Day | 'priority'>('monday');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tasks from the API
  const fetchTasks = async () => {
    console.log('StaffTaskPanel: Starting to fetch tasks...');
    try {
      const tasksData = await apiService.getTasks();
      console.log('StaffTaskPanel: Tasks fetched successfully:', tasksData);
      console.log('StaffTaskPanel: Number of tasks:', tasksData.length);
      setTasks(tasksData);
    } catch (error) {
      console.error('StaffTaskPanel: Failed to fetch tasks:', error);
      // Fallback to empty tasks array if API fails
    }
  };

  useEffect(() => {
    const dayIndex = (new Date().getDay() + 6) % 7;
    const dayMap: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    setActiveView(dayMap[dayIndex]);
    fetchTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    console.log('StaffTaskPanel: Filtering tasks...');
    console.log('StaffTaskPanel: Total tasks:', tasks.length);
    console.log('StaffTaskPanel: Active view:', activeView);
    console.log('StaffTaskPanel: Category filter:', categoryFilter);
    console.log('StaffTaskPanel: Status filter:', statusFilter);
    console.log('StaffTaskPanel: Search term:', searchTerm);
    
    const filtered = tasks.filter(task => {
      const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter;
      const statusMatch = statusFilter === 'all' || task.status === statusFilter;
      const searchMatch = task.task.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!searchMatch || !categoryMatch || !statusMatch) return false;
      
      if (activeView === 'priority') return task.taskType === 'Priority';
      return task.day === activeView;
    });
    
    console.log('StaffTaskPanel: Filtered tasks:', filtered.length);
    console.log('StaffTaskPanel: Sample filtered task:', filtered[0]);
    
    return filtered;
  }, [tasks, activeView, categoryFilter, statusFilter, searchTerm]);

  const handleImageCapture = async (taskId: number, imageUrl: string) => {
    try {
      // Convert data URL to file
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "task-image.jpg", { type: "image/jpeg" });
      
      // Upload image via API
      const result = await apiService.uploadFile(taskId, file, 'image');
      const serverImageUrl = result.url;
      
      // Update local state
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, imageUrl: serverImageUrl } : task
      ));
      setSelectedTask(prev => prev ? { ...prev, imageUrl: serverImageUrl } : null);
    } catch (error) {
      console.error('Failed to upload image:', error);
      
      // Fallback: Update locally if API fails
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, imageUrl } : task
      ));
      setSelectedTask(prev => prev ? { ...prev, imageUrl } : null);
    }
  };

  const handleTaskSubmit = async (taskId: number, initials?: string) => {
    try {
      console.log('Submitting task:', taskId, 'with initials:', initials);
      
      // Find the task to get media URLs
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      // Submit the task with media URLs and initials
      const updatedTask = await apiService.submitTask(taskId, task.imageUrl, task.videoUrl, initials);
      console.log('Task submitted successfully:', updatedTask);
      
      // Update tasks in the UI with the full updated task data
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? updatedTask : t
      ));
      
      // Update selected task if it's the one being submitted
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updatedTask);
      }
    } catch (error) {
      console.error('Failed to submit task:', error);
    }
  };

  const handleInitialsUpdate = async (taskId: number, initials: string) => {
    // Update the task in local state with the new initials
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, initials } : t
    ));
    
    // Update selected task if it's the one being updated
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, initials });
    }
  };

  const handleVideoCapture = async (taskId: number, videoUrl: string) => {
    try {
      // Convert data URL to file
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const file = new File([blob], "task-video.mp4", { type: "video/mp4" });
      
      // Upload video via API
      const result = await apiService.uploadFile(taskId, file, 'video');
      const serverVideoUrl = result.url;
      
      // Update local state
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, videoUrl: serverVideoUrl } : task
      ));
      setSelectedTask(prev => prev ? { ...prev, videoUrl: serverVideoUrl } : null);
    } catch (error) {
      console.error('Failed to upload video:', error);
      
      // Fallback: Update locally if API fails
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, videoUrl } : task
      ));
      setSelectedTask(prev => prev ? { ...prev, videoUrl } : null);
    }
  };

  return (
    <>
      {/* Custom styles for responsive design - Mobile-first approach */}
      <style>{`
        .sleek-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; } 
        .sleek-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .sleek-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; } 
        .sleek-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; } 
        .sleek-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
        
        /* Mobile-first responsive improvements */
        .mobile-scroll-x {
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .mobile-scroll-x::-webkit-scrollbar {
          display: none;
        }
        
        .mobile-tab-container {
          display: flex;
          gap: 0.5rem;
          padding-bottom: 0.5rem;
          min-width: max-content;
        }
        
        .mobile-tab-item {
          flex-shrink: 0;
          white-space: nowrap;
          min-width: fit-content;
        }
        
        /* Safe area support for mobile devices */
        @media (max-width: 768px) {
          .mobile-safe-area {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
      
      <StaffTaskDetailModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
        onImageCapture={handleImageCapture} 
        onVideoCapture={handleVideoCapture}
        onTaskSubmit={handleTaskSubmit}
        onInitialsUpdate={handleInitialsUpdate}
      />
      
      {/* Mobile-first responsive layout */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen font-sans mobile-safe-area">
        
        {/* Mobile Header */}
        <header className="bg-white shadow-sm p-3 sm:p-4 lg:hidden sticky top-0 z-20 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">My Tasks</h1>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          <p className="text-gray-500 text-sm mb-3">View and complete your assigned tasks</p>
          <div className="flex gap-2">
            <button 
              onClick={fetchTasks}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden xs:inline">Refresh</span>
            </button>
            <PWAInstallButton />
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:px-8 lg:py-6 max-w-7xl mx-auto">
          
          {/* Desktop Header - Enhanced responsive design */}
          <div className="hidden lg:flex flex-col space-y-4 xl:flex-row xl:items-center xl:justify-between xl:space-y-0 mb-6">
            <div className="text-center xl:text-left">
              <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 tracking-tight">
                Staff Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-500">
                View and complete your assigned tasks
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <PWAInstallButton />
              <button 
                onClick={fetchTasks}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Tasks
              </button>
              <button 
                onClick={onLogout} 
                className="w-full sm:w-auto bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Main Panel - Enhanced responsive card design */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            
            {/* Search and Filters - Mobile-first optimized */}
            <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col space-y-3 sm:space-y-4">
                
                {/* Search Bar - Enhanced responsive design */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search my tasks..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm text-sm sm:text-base" 
                  />
                </div>

                {/* Day Tabs - Enhanced horizontal scroll with better mobile UX */}
                <div className="border-b border-gray-200 pb-2">
                  <div className="mobile-scroll-x">
                    <div className="mobile-tab-container">
                      <button 
                        onClick={() => setActiveView('priority')} 
                        className={`mobile-tab-item px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                          activeView === 'priority' 
                            ? 'bg-red-500 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        🔥 Priority
                      </button>
                      {DAYS.map(day => (
                        <button 
                          key={day} 
                          onClick={() => setActiveView(day)} 
                          className={`mobile-tab-item px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg capitalize transition-all duration-200 ${
                            activeView === day 
                              ? 'bg-blue-500 text-white shadow-md' 
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <span className="hidden sm:inline">{day}</span>
                          <span className="sm:hidden">{day.substring(0, 3)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category Filters - Enhanced horizontal scroll for mobile */}
                <div className="border-b border-gray-200 pb-2">
                  <div className="mobile-scroll-x">
                    <div className="mobile-tab-container">
                      <button 
                        onClick={() => setCategoryFilter('all')} 
                        className={`mobile-tab-item px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                          categoryFilter === 'all' 
                            ? 'bg-gray-800 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        All Categories
                      </button>
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setCategoryFilter(cat)} 
                          className={`mobile-tab-item px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                            categoryFilter === cat 
                              ? 'bg-green-500 text-white shadow-md' 
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <span className="hidden sm:inline">{cat}</span>
                          <span className="sm:hidden">{cat.substring(0, 4)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Filters - Enhanced mobile design */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-600 self-center mr-2">Status:</span>
                  <button 
                    onClick={() => setStatusFilter('all')} 
                    className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                      statusFilter === 'all' 
                        ? 'bg-purple-500 text-white shadow-md' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setStatusFilter('Unknown')} 
                    className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                      statusFilter === 'Unknown' 
                        ? 'bg-yellow-500 text-white shadow-md' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    New
                  </button>
                  <button 
                    onClick={() => setStatusFilter('Submitted')} 
                    className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                      statusFilter === 'Submitted' 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Submitted
                  </button>
                  <button 
                    onClick={() => setStatusFilter('Done')} 
                    className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                      statusFilter === 'Done' 
                        ? 'bg-green-500 text-white shadow-md' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Done
                  </button>
                  <button 
                    onClick={() => setStatusFilter('Declined')} 
                    className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                      statusFilter === 'Declined' 
                        ? 'bg-red-500 text-white shadow-md' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Declined
                  </button>
                </div>
              </div>
            </div>

            {/* Tasks Display - Enhanced responsive table/cards */}
            <div className="p-3 sm:p-4 lg:p-6">
              {filteredTasks.length > 0 ? (
                <>
                  {/* Desktop Table - Enhanced responsive design */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-700">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider rounded-lg">
                        <tr>
                          <th scope="col" className="px-6 py-4 font-semibold rounded-l-lg">Task</th>
                          <th scope="col" className="px-6 py-4 font-semibold">Category</th>
                          <th scope="col" className="px-6 py-4 font-semibold">Assigned To</th>
                          <th scope="col" className="px-6 py-4 font-semibold rounded-r-lg">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTasks.map(task => (
                          <tr 
                            key={task.id} 
                            onClick={() => setSelectedTask(task)} 
                            className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                              task.status === 'Done' ? 'opacity-60' : ''
                            }`}
                          >
                            <td className={`px-6 py-4 font-medium ${
                              task.status === 'Done' 
                                ? 'text-gray-500 line-through' 
                                : 'text-gray-900'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  task.taskType === 'Priority' ? 'bg-red-400' : 'bg-blue-400'
                                }`}></div>
                                {task.task}
                              </div>
                            </td>
                            <td className={`px-6 py-4 capitalize ${
                              task.status === 'Done' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {task.category}
                            </td>
                            <td className={`px-6 py-4 ${
                              task.status === 'Done' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <div className="flex items-center gap-2">
                                {task.initials ? (
                                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                    {task.initials}
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs">
                                    ?
                                  </div>
                                )}
                                <span>{task.initials || 'Unassigned'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={task.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards - Enhanced design matching target layout */}
                  <div className="lg:hidden space-y-3 sm:space-y-4">
                    {filteredTasks.map(task => (
                      <div 
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                          task.status === 'Done' ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Task Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${
                                task.taskType === 'Priority' ? 'bg-red-400' : 'bg-blue-400'
                              }`}></div>
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {task.category}
                              </span>
                              {task.taskType === 'Priority' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                  🔥 Priority
                                </span>
                              )}
                            </div>
                            <h3 className={`font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 ${
                              task.status === 'Done' ? 'line-through text-gray-500' : ''
                            }`}>
                              {task.task}
                            </h3>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>

                        {/* Task Details */}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            {task.initials ? (
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                {task.initials}
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs">
                                ?
                              </div>
                            )}
                            <span className="text-xs sm:text-sm">{task.initials || 'Unassigned'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 capitalize">
                              {task.day === activeView ? 'Today' : task.day}
                            </span>
                            {task.imageUrl && (
                              <div className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            {task.videoUrl && (
                              <div className="w-4 h-4 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons for mobile */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {task.status === 'Unknown' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                }}
                                className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                              >
                                Start Task
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                              }}
                              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <span>Tap for details</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Tasks Found</h3>
                  <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria to see more tasks.'
                      : 'All caught up! No tasks assigned to you right now.'
                    }
                  </p>
                  <button 
                    onClick={fetchTasks}
                    className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all inline-flex items-center gap-2 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Tasks
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffTaskPanel;
