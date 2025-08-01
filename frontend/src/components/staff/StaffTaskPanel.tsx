import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Day, Category, Status } from '../../types';
import { CATEGORIES, DAYS } from '../../data/tasks';
import StatusBadge from '../common/StatusBadge';
import StaffTaskDetailModal from './StaffTaskDetailModal';
import PWAInstallButton from '../common/PWAInstallButton';
import apiService from '../../services/apiService';
import DOMPurify from 'dompurify';

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

  // Utility function to safely render task content and prevent XSS
  const sanitizeTaskContent = (content: string) => {
    return DOMPurify.sanitize(content, { 
      ALLOWED_TAGS: [], // Only allow plain text, no HTML tags
      ALLOWED_ATTR: [] 
    });
  };

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
      
      <StaffTaskDetailModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
        onImageCapture={handleImageCapture} 
        onVideoCapture={handleVideoCapture}
        onTaskSubmit={handleTaskSubmit}
        onInitialsUpdate={handleInitialsUpdate}
      />
      
      {/* Ultra Mobile-first responsive layout */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen font-sans">
        <div className="px-2 xxs:px-3 xs:px-4 sm:px-6 lg:px-8 py-3 xxs:py-4 xs:py-6 max-w-7xl mx-auto">
          
          {/* Header - Ultra Mobile Responsive */}
          <div className="flex flex-col space-y-2 xxs:space-y-3 xs:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-3 xxs:mb-4 xs:mb-6">
            <div className="text-center sm:text-left">
              <h1 className="text-lg xxs:text-xl xs:text-2xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                Staff Dashboard
              </h1>
              <p className="mt-0.5 xxs:mt-1 text-xs xxs:text-xs xs:text-sm text-gray-600">
                <span className="hidden xxs:inline">View and complete your assigned tasks</span>
                <span className="xxs:hidden">Complete tasks</span>
              </p>
            </div>
            <div className="flex flex-col space-y-1.5 xxs:space-y-2 xs:flex-row xs:space-y-0 xs:space-x-2 sm:space-x-3">
              <PWAInstallButton />
              <button 
                onClick={fetchTasks}
                className="w-full xs:w-auto bg-blue-600 text-white px-3 xxs:px-4 xs:px-6 py-2 xxs:py-2.5 xs:py-3 rounded-lg xs:rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5 xxs:gap-2 text-xs xxs:text-sm xs:text-base"
              >
                <svg className="w-3 h-3 xxs:w-4 xxs:h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden xxs:inline xs:hidden">Refresh</span>
                <span className="xxs:hidden xs:inline">Refresh Tasks</span>
              </button>
              <button 
                onClick={onLogout} 
                className="w-full xs:w-auto bg-red-500 text-white px-3 xxs:px-4 xs:px-6 py-2 xxs:py-2.5 xs:py-3 rounded-lg xs:rounded-xl font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5 xxs:gap-2 text-xs xxs:text-sm xs:text-base"
              >
                <svg className="w-3 h-3 xxs:w-4 xxs:h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Main Panel - Ultra Mobile Responsive Card Design */}
          <div className="bg-white rounded-md xxs:rounded-lg xs:rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            
            {/* Search and Filters - Ultra Mobile Optimized */}
            <div className="p-2 xxs:p-3 xs:p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col space-y-2 xxs:space-y-3 xs:space-y-4">
                
                {/* Search Bar - Mobile First */}
                <div className="relative">
                  <svg className="absolute left-2 xxs:left-2.5 xs:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 xxs:w-4 xxs:h-4 xs:w-5 xs:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-7 xxs:pl-8 xs:pl-10 pr-2 xxs:pr-3 xs:pr-4 py-2 xxs:py-2.5 xs:py-3 border border-gray-200 rounded-md xxs:rounded-lg xs:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm text-xs xxs:text-sm xs:text-base" 
                  />
                </div>

                {/* Day Tabs - Ultra Mobile Horizontal Scroll */}
                <div className="w-full">
                  <div className="flex gap-1 xxs:gap-1.5 xs:gap-2 overflow-x-auto pb-1.5 xxs:pb-2 sleek-scrollbar -mx-0.5 xxs:-mx-1 px-0.5 xxs:px-1">
                    <button 
                      onClick={() => setActiveView('priority')} 
                      className={`flex-shrink-0 px-2 xxs:px-2.5 xs:px-3 sm:px-4 py-1 xxs:py-1.5 xs:py-2 text-xs sm:text-sm font-medium rounded xxs:rounded-md xs:rounded-lg transition-all duration-200 whitespace-nowrap ${
                        activeView === 'priority' 
                          ? 'bg-red-500 text-white shadow-md' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="hidden xxs:inline">🔥 Priority</span>
                      <span className="xxs:hidden">🔥</span>
                    </button>
                    {DAYS.map(day => (
                      <button 
                        key={day} 
                        onClick={() => setActiveView(day)} 
                        className={`flex-shrink-0 px-2 xxs:px-2.5 xs:px-3 sm:px-4 py-1 xxs:py-1.5 xs:py-2 text-xs sm:text-sm font-medium rounded xxs:rounded-md xs:rounded-lg capitalize transition-all duration-200 whitespace-nowrap ${
                          activeView === day 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span className="hidden xxs:inline xs:hidden">{day.substring(0, 3)}</span>
                        <span className="xxs:hidden xs:inline">{day}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filters - Ultra Mobile Horizontal Scroll */}
                <div className="w-full">
                  <div className="flex gap-1 xxs:gap-1.5 xs:gap-2 overflow-x-auto sleek-scrollbar -mx-0.5 xxs:-mx-1 px-0.5 xxs:px-1">
                    <button 
                      onClick={() => setCategoryFilter('all')} 
                      className={`flex-shrink-0 px-2 xxs:px-2.5 xs:px-3 sm:px-4 py-1 xxs:py-1.5 xs:py-2 text-xs sm:text-sm font-medium rounded xxs:rounded-md xs:rounded-lg transition-all duration-200 whitespace-nowrap ${
                        categoryFilter === 'all' 
                          ? 'bg-gray-800 text-white shadow-md' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="hidden xxs:inline">All Categories</span>
                      <span className="xxs:hidden">All</span>
                    </button>
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setCategoryFilter(cat)} 
                        className={`flex-shrink-0 px-2 xxs:px-2.5 xs:px-3 sm:px-4 py-1 xxs:py-1.5 xs:py-2 text-xs sm:text-sm font-medium rounded xxs:rounded-md xs:rounded-lg transition-all duration-200 whitespace-nowrap ${
                          categoryFilter === cat 
                            ? 'bg-green-500 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span className="hidden xxs:inline sm:hidden">{cat.length > 6 ? cat.slice(0, 4) + '..' : cat}</span>
                        <span className="xxs:hidden sm:inline">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filters - Ultra Mobile Horizontal Scroll */}
                <div className="w-full">
                  <div className="flex gap-1 xxs:gap-1.5 xs:gap-2 overflow-x-auto sleek-scrollbar -mx-0.5 xxs:-mx-1 px-0.5 xxs:px-1">
                    <span className="flex-shrink-0 text-xs xxs:text-xs xs:text-sm font-medium text-gray-600 self-center mr-0.5 xxs:mr-1 whitespace-nowrap">
                      <span className="hidden xxs:inline">Status:</span>
                      <span className="xxs:hidden">St:</span>
                    </span>
                    <button 
                      onClick={() => setStatusFilter('all')} 
                      className={`flex-shrink-0 px-1.5 xxs:px-2.5 xs:px-3 py-0.5 xxs:py-1 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                        statusFilter === 'all' 
                          ? 'bg-purple-500 text-white shadow-md' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setStatusFilter('Unknown')} 
                      className={`flex-shrink-0 px-1.5 xxs:px-2.5 xs:px-3 py-0.5 xxs:py-1 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                        statusFilter === 'Unknown' 
                          ? 'bg-yellow-500 text-white shadow-md' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      New
                    </button>
                    <button 
                      onClick={() => setStatusFilter('Submitted')} 
                      className={`flex-shrink-0 px-1.5 xxs:px-2.5 xs:px-3 py-0.5 xxs:py-1 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                        statusFilter === 'Submitted' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="hidden xxs:inline">Submitted</span>
                      <span className="xxs:hidden">Sub</span>
                    </button>
                    <button 
                      onClick={() => setStatusFilter('Done')} 
                      className={`flex-shrink-0 px-1.5 xxs:px-2.5 xs:px-3 py-0.5 xxs:py-1 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                        statusFilter === 'Done' 
                          ? 'bg-green-500 text-white shadow-md' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      Done
                    </button>
                    <button 
                      onClick={() => setStatusFilter('Declined')} 
                      className={`flex-shrink-0 px-1.5 xxs:px-2.5 xs:px-3 py-0.5 xxs:py-1 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                        statusFilter === 'Declined' 
                          ? 'bg-red-500 text-white shadow-md' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="hidden xxs:inline">Declined</span>
                      <span className="xxs:hidden">Dec</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Display - Ultra Mobile Responsive */}
            <div className="p-3 xs:p-4 sm:p-6">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider rounded-lg">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-semibold rounded-l-lg">Task</th>
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
                            {sanitizeTaskContent(task.task)}
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${
                          task.status === 'Done' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <div className="flex items-center gap-2">
                            {task.initials ? (
                              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                {task.initials}
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-sm">
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

              {/* Mobile Cards - Ultra Responsive */}
              <div className="md:hidden space-y-1.5 xxs:space-y-2 xs:space-y-3">
                {filteredTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`bg-white border border-gray-200 rounded-md xxs:rounded-lg xs:rounded-xl p-2 xxs:p-3 xs:p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                      task.status === 'Done' ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Task Header - Ultra Compact */}
                    <div className="flex items-start justify-between mb-1.5 xxs:mb-2 xs:mb-3">
                      <div className="flex-1 min-w-0 pr-1 xxs:pr-2">
                        <div className="flex items-center gap-1 xxs:gap-1.5 xs:gap-2 mb-0.5 xxs:mb-1">
                          <div className={`w-1 h-1 xxs:w-1.5 xxs:h-1.5 xs:w-2 xs:h-2 rounded-full ${
                            task.taskType === 'Priority' ? 'bg-red-400' : 'bg-blue-400'
                          }`}></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                            <span className="hidden xxs:inline">{task.category}</span>
                            <span className="xxs:hidden">{task.category.slice(0, 4)}</span>
                          </span>
                        </div>
                        <h3 className={`font-semibold text-xs xxs:text-sm xs:text-base text-gray-900 leading-tight ${
                          task.status === 'Done' ? 'line-through text-gray-500' : ''
                        }`}>
                          {sanitizeTaskContent(task.task)}
                        </h3>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={task.status} />
                      </div>
                    </div>

                    {/* Task Details - Ultra Compact */}
                    <div className="flex items-center justify-between text-xs xs:text-sm text-gray-600">
                      <div className="flex items-center gap-1 xxs:gap-1.5 xs:gap-2">
                        {task.initials ? (
                          <div className="w-4 h-4 xxs:w-5 xxs:h-5 xs:w-6 xs:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                            {task.initials}
                          </div>
                        ) : (
                          <div className="w-4 h-4 xxs:w-5 xxs:h-5 xs:w-6 xs:h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs">
                            ?
                          </div>
                        )}
                        <span className="truncate max-w-16 xxs:max-w-20 xs:max-w-full">
                          <span className="hidden xxs:inline">{task.initials || 'Unassigned'}</span>
                          <span className="xxs:hidden">{(task.initials || 'N/A').slice(0, 3)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 xxs:gap-1 xs:gap-1.5 xs:gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400 capitalize">
                          <span className="hidden xxs:inline">
                            {task.day === activeView ? 'Today' : task.day}
                          </span>
                          <span className="xxs:hidden">
                            {task.day === activeView ? 'Now' : task.day?.slice(0, 3)}
                          </span>
                        </span>
                        {task.imageUrl && (
                          <div className="w-2.5 h-2.5 xxs:w-3 xxs:h-3 xs:w-4 xs:h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <svg className="w-1.5 h-1.5 xxs:w-2 xxs:h-2 xs:w-2.5 xs:h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {task.videoUrl && (
                          <div className="w-2.5 h-2.5 xxs:w-3 xxs:h-3 xs:w-4 xs:h-4 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                            <svg className="w-1.5 h-1.5 xxs:w-2 xxs:h-2 xs:w-2.5 xs:h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action hint for mobile - Ultra Compact */}
                    <div className="mt-1.5 xxs:mt-2 xs:mt-3 pt-1.5 xxs:pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="hidden xxs:inline">Tap to view details</span>
                        <span className="xxs:hidden">Tap for details</span>
                        <svg className="w-2.5 h-2.5 xxs:w-3 xxs:h-3 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State - Ultra Mobile Responsive */}
              {filteredTasks.length === 0 && (
                <div className="text-center py-8 xxs:py-12 xs:py-16">
                  <div className="w-12 h-12 xxs:w-14 xxs:h-14 xs:w-16 xs:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 xxs:mb-4">
                    <svg className="w-6 h-6 xxs:w-7 xxs:h-7 xs:w-8 xs:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-base xxs:text-lg font-semibold text-gray-600 mb-1 xxs:mb-2">No Tasks Found</h3>
                  <p className="text-gray-500 max-w-xs xxs:max-w-sm xs:max-w-md mx-auto text-xs xxs:text-sm xs:text-base px-2 xxs:px-0">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                      ? (
                        <>
                          <span className="hidden xxs:inline">Try adjusting your search or filter criteria to see more tasks.</span>
                          <span className="xxs:hidden">Adjust filters to see more tasks.</span>
                        </>
                      )
                      : (
                        <>
                          <span className="hidden xxs:inline">All caught up! No tasks assigned to you right now.</span>
                          <span className="xxs:hidden">No tasks assigned right now.</span>
                        </>
                      )
                    }
                  </p>
                  <button 
                    onClick={fetchTasks}
                    className="mt-3 xxs:mt-4 bg-blue-600 text-white px-4 xxs:px-6 py-2 xxs:py-3 rounded-lg xxs:rounded-xl font-semibold hover:bg-blue-700 transition-all inline-flex items-center gap-1 xxs:gap-2 text-xs xxs:text-sm xs:text-base"
                  >
                    <svg className="w-3 h-3 xxs:w-4 xxs:h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden xxs:inline">Refresh Tasks</span>
                    <span className="xxs:hidden">Refresh</span>
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
