import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Day, Category, Status, CleaningAsset, CleaningLogsResponse, NFCAssetsResponse } from '../../types';
import { CATEGORIES, DAYS } from '../../data/tasks';
import StatusBadge from '../common/StatusBadge';
import { ActionsIcon } from '../common/Icons';
import AddTaskModal from './AddTaskModal';
import TaskDetailModal from './TaskDetailModal';
import PWAInstallButton from '../common/PWAInstallButton';
import apiService from '../../services/apiService';
import DOMPurify from 'dompurify';

// Define main tab types
type MainTab = 'all-tasks' | 'cleaning-logs';


interface AdminTaskPanelProps {
  onLogout: () => void;
}

const AdminTaskPanel: React.FC<AdminTaskPanelProps> = ({ onLogout }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]); // Start with empty tasks
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('all-tasks');
  const [activeView, setActiveView] = useState<Day | 'priority'>('monday');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  // const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all'); // Removed unused variable
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  
  // Cleaning logs state
  const [cleaningAssets, setCleaningAssets] = useState<CleaningAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLogsResponse | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Utility function to safely render task content and prevent XSS
  const sanitizeTaskContent = (content: string) => {
    return DOMPurify.sanitize(content, { 
      ALLOWED_TAGS: [], // Only allow plain text, no HTML tags
      ALLOWED_ATTR: [] 
    });
  };

  useEffect(() => {
    const dayIndex = (new Date().getDay() + 6) % 7;
    const dayMap: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    setActiveView(dayMap[dayIndex]);
    
    // Fetch tasks from the API
    const fetchTasks = async () => {
      console.log('AdminTaskPanel: Starting to fetch tasks...');
      try {
        const tasksData = await apiService.getTasks();
        console.log('AdminTaskPanel: Tasks fetched successfully:', tasksData);
        console.log('AdminTaskPanel: Number of tasks:', tasksData.length);
        setTasks(tasksData);
      } catch (error) {
        console.error('AdminTaskPanel: Failed to fetch tasks:', error);
        // Fallback to empty tasks array if API fails
      }
    };
    
    fetchTasks();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [openDropdown]);

  // Fetch cleaning assets when cleaning-logs tab is active
  useEffect(() => {
    if (activeMainTab === 'cleaning-logs') {
      fetchCleaningAssets();
    }
  }, [activeMainTab]);

  const filteredTasks = useMemo(() => {
    console.log('AdminTaskPanel: Filtering tasks...');
    console.log('AdminTaskPanel: Total tasks:', tasks.length);
    console.log('AdminTaskPanel: Active view:', activeView);
    console.log('AdminTaskPanel: Category filter:', categoryFilter);
    console.log('AdminTaskPanel: Search term:', searchTerm);
    
    const filtered = tasks.filter(task => {
      const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter;
      const searchMatch = task.task.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!searchMatch || !categoryMatch) return false;
      
      if (activeView === 'priority') return task.taskType === 'Priority';
      return task.day === activeView;
    });
    
    console.log('AdminTaskPanel: Filtered tasks:', filtered.length);
    console.log('AdminTaskPanel: Sample filtered task:', filtered[0]);
    
    return filtered;
  }, [tasks, activeView, categoryFilter, searchTerm]);

    const handleAddTask = async (newTasks: Omit<Task, 'id' | 'status'>[]) => {
    try {
      // Create tasks via API one by one
      const createdTasks: Task[] = [];
      
      for (const task of newTasks) {
        try {
          const createdTask = await apiService.createTask(task);
          createdTasks.push(createdTask);
          console.log('Created task:', createdTask);
        } catch (error) {
          console.error('Error creating single task:', error);
          // If any task fails, show error and don't update local state
          alert(`Failed to create task: ${task.task}. Please try again.`);
          return; // Exit early on failure
        }
      }
      
      // Add the newly created tasks to the state only if all succeeded
      if (createdTasks.length > 0) {
        setTasks(prevTasks => [...prevTasks, ...createdTasks]);
        console.log('Tasks created successfully:', createdTasks);
      }
    } catch (error) {
      console.error('Failed to create tasks:', error);
      alert('Failed to create tasks. Please check your connection and try again.');
    } finally {
      setIsAddModalOpen(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: Status) => {
    try {
      // Update status via API
      const updatedTask = await apiService.updateTaskStatus(taskId, newStatus);
      
      // Update local state
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      console.error('Failed to update task status:', error);
      
      // Fallback: Update status locally if API fails
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    }
  };

  const handleTaskApprove = async (taskId: number) => {
    try {
      console.log('Approving task:', taskId);
      const updatedTask = await apiService.approveTask(taskId);
      console.log('Task approved successfully:', updatedTask);
      
      // Update tasks in the UI with the complete updated task
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? updatedTask : t
      ));
      
      // Update selected task if it's the one being approved
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updatedTask);
      }
    } catch (error) {
      console.error('Failed to approve task:', error);
    }
  };

  const handleTaskDecline = async (taskId: number, reason: string) => {
    try {
      console.log('Declining task:', taskId, 'with reason:', reason);
      const updatedTask = await apiService.declineTask(taskId, reason);
      console.log('Task declined successfully:', updatedTask);
      
      // Update tasks in the UI with the complete updated task
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? updatedTask : t
      ));
      
      // Update selected task if it's the one being declined
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updatedTask);
      }
    } catch (error) {
      console.error('Failed to decline task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiService.deleteTask(taskId);
      console.log('Task deleted successfully:', taskId);
      
      // Remove task from UI
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      
      // Close modal if this task was selected
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Show error to user
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setOpenDropdown(null);
  };

  const toggleDropdown = (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === taskId ? null : taskId);
  };

  // Cleaning logs functions
  const fetchCleaningAssets = async () => {
    try {
      setLoadingAssets(true);
      // Get restaurant ID from localStorage or auth context
      const userData = localStorage.getItem('userData');
      if (!userData) {
        console.error('No user data found');
        return;
      }
      
      const user = JSON.parse(userData);
      const restaurantId = user.id;
      
      const assetsData: NFCAssetsResponse = await apiService.getNfcAssets(restaurantId);
      setCleaningAssets(assetsData.assets);
    } catch (error) {
      console.error('Failed to fetch cleaning assets:', error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchCleaningLogs = async (assetId: string) => {
    try {
      setLoadingLogs(true);
      const logsData: CleaningLogsResponse = await apiService.getCleaningLogs(assetId, 7);
      setCleaningLogs(logsData);
      setSelectedAsset(assetId);
    } catch (error) {
      console.error('Failed to fetch cleaning logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Remove unused function
  
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Mobile-first responsive layout */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen font-sans overflow-x-hidden">
        <div className="px-2 xxs:px-3 xs:px-4 sm:px-6 lg:px-8 py-3 xxs:py-4 sm:py-6 max-w-7xl mx-auto">
          
          {/* Header - Ultra Mobile Responsive */}
          <div className="flex flex-col space-y-2 xxs:space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-3 xxs:mb-4 sm:mb-6">
            <div className="text-center sm:text-left">
              <h1 className="text-base xxs:text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                Admin Dashboard
              </h1>
              <p className="mt-0.5 xxs:mt-1 text-xs sm:text-sm text-gray-600">
                Manage and oversee all restaurant tasks
              </p>
            </div>
            <div className="flex flex-col space-y-1.5 xxs:space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 lg:space-x-3">
              <PWAInstallButton />
              <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="w-full sm:w-auto bg-indigo-600 text-white px-3 xxs:px-4 sm:px-6 py-2 xxs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5 xxs:gap-2 text-xs xxs:text-sm sm:text-base"
              >
                <svg className="w-3 h-3 xxs:w-4 xxs:h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden xxs:inline xs:hidden">Add Task</span>
                <span className="xxs:hidden xs:inline sm:hidden">Add Task</span>
                <span className="hidden sm:inline">Add New Task</span>
              </button>
              <button 
                onClick={onLogout} 
                className="w-full sm:w-auto bg-red-500 text-white px-3 xxs:px-4 sm:px-6 py-2 xxs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5 xxs:gap-2 text-xs xxs:text-sm sm:text-base"
              >
                <svg className="w-3 h-3 xxs:w-4 xxs:h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Main Panel - Ultra Mobile Responsive Card Design */}
          <div className="bg-white rounded-md xxs:rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            
            {/* Main Tab Navigation */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveMainTab('all-tasks')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                    activeMainTab === 'all-tasks'
                      ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:bg-gray-50'
                  }`}
                >
                  All Tasks
                </button>
                <button
                  onClick={() => setActiveMainTab('cleaning-logs')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                    activeMainTab === 'cleaning-logs'
                      ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:bg-gray-50'
                  }`}
                >
                  🧽 Cleaning Logs
                </button>
              </div>
            </div>

            {/* All Tasks Tab Content */}
            {activeMainTab === 'all-tasks' && (
              <div>
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
                        className="w-full pl-7 xxs:pl-8 xs:pl-10 pr-2 xxs:pr-3 xs:pr-4 py-2 xxs:py-2.5 xs:py-3 border border-gray-200 rounded-md xxs:rounded-lg xs:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white shadow-sm text-xs xxs:text-sm xs:text-base" 
                      />
                    </div>

                    {/* Day Tabs - Ultra Mobile Horizontal Scroll */}
                    <div className="w-full">
                      <div className="flex gap-1 xxs:gap-1.5 xs:gap-2 overflow-x-auto pb-1.5 xxs:pb-2 sleek-scrollbar">
                        <button 
                          onClick={() => setActiveView('priority')} 
                          className={`flex-shrink-0 px-2 xxs:px-2.5 xs:px-3 sm:px-4 py-1 xxs:py-1.5 xs:py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded xxs:rounded-md xs:rounded-lg transition-all duration-200 whitespace-nowrap ${
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
                            className={`flex-shrink-0 px-2 xxs:px-2.5 xs:px-3 sm:px-4 py-1 xxs:py-1.5 xs:py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded xxs:rounded-md xs:rounded-lg capitalize transition-all duration-200 whitespace-nowrap ${
                              activeView === day 
                                ? 'bg-indigo-500 text-white shadow-md' 
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            <span className="hidden xxs:inline xs:hidden">{day.slice(0, 3)}</span>
                            <span className="xxs:hidden xs:inline">{day}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category Filters - Ultra Mobile Horizontal Scroll */}
                    <div className="w-full">
                      <div className="flex gap-1 xxs:gap-1.5 xs:gap-2 overflow-x-auto sleek-scrollbar">
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
                      <th scope="col" className="px-6 py-4 font-semibold">Initials</th>
                      <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                      <th scope="col" className="px-6 py-4 font-semibold text-center">Media</th>
                      <th scope="col" className="px-6 py-4 font-semibold text-center rounded-r-lg">Actions</th>
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
                              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
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
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <a
                              href={task.imageUrl || '#'}
                              target={task.imageUrl ? "_blank" : undefined}
                              rel={task.imageUrl ? "noopener noreferrer" : undefined}
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                task.imageUrl 
                                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer' 
                                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!task.imageUrl) e.preventDefault();
                              }}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {task.imageUrl ? 'Image' : 'No Image'}
                            </a>
                            
                            <a
                              href={task.videoUrl || '#'}
                              target={task.videoUrl ? "_blank" : undefined}
                              rel={task.videoUrl ? "noopener noreferrer" : undefined}
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                task.videoUrl 
                                  ? 'text-green-600 bg-green-50 hover:bg-green-100 cursor-pointer' 
                                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!task.videoUrl) e.preventDefault();
                              }}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              {task.videoUrl ? 'Video' : 'No Video'}
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="relative">
                            <button 
                              className={`p-2 rounded-full transition-all ${
                                task.status === 'Done'
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-800'
                              }`}
                              onClick={(e) => {
                                if (task.status !== 'Done') {
                                  toggleDropdown(task.id, e);
                                }
                              }}
                              disabled={task.status === 'Done'}
                            >
                              <ActionsIcon className="w-5 h-5" />
                            </button>
                            
                            {openDropdown === task.id && task.status !== 'Done' && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-10 min-w-[140px] overflow-hidden">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit Task
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    handleDeleteTask(task.id);
                                  }}
                                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
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
                      <div className="flex items-center gap-0.5 xxs:gap-1 xs:gap-2 flex-shrink-0">
                        <StatusBadge status={task.status} />
                        {task.status !== 'Done' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(task.id, e);
                            }}
                            className="p-0.5 xxs:p-1 xs:p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <ActionsIcon className="w-3 h-3 xxs:w-4 xxs:h-4 xs:w-5 xs:h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Task Details - Ultra Compact */}
                    <div className="flex items-center justify-between text-xs xs:text-sm text-gray-600">
                      <div className="flex items-center gap-1 xxs:gap-1.5 xs:gap-2">
                        {task.initials ? (
                          <div className="w-4 h-4 xxs:w-5 xxs:h-5 xs:w-6 xs:h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold">
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
                      <span className="text-xs text-gray-400 capitalize flex-shrink-0">
                        <span className="hidden xxs:inline">
                          {task.day === activeView ? 'Today' : task.day}
                        </span>
                        <span className="xxs:hidden">
                          {task.day === activeView ? 'Now' : task.day?.slice(0, 3)}
                        </span>
                      </span>
                    </div>

                    {/* Media Links - Mobile */}
                    <div className="mt-1.5 xxs:mt-2 xs:mt-3 pt-1.5 xxs:pt-2 xs:pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 xxs:gap-1.5 xs:gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium">Media:</span>
                        <a
                          href={task.imageUrl || '#'}
                          target={task.imageUrl ? "_blank" : undefined}
                          rel={task.imageUrl ? "noopener noreferrer" : undefined}
                          className={`inline-flex items-center px-1.5 xxs:px-2 py-0.5 xxs:py-1 text-xs font-medium rounded transition-colors ${
                            task.imageUrl 
                              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer' 
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!task.imageUrl) e.preventDefault();
                          }}
                        >
                          <svg className="w-2.5 h-2.5 xxs:w-3 xxs:h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {task.imageUrl ? 'Image' : 'No Image'}
                        </a>
                        
                        <a
                          href={task.videoUrl || '#'}
                          target={task.videoUrl ? "_blank" : undefined}
                          rel={task.videoUrl ? "noopener noreferrer" : undefined}
                          className={`inline-flex items-center px-1.5 xxs:px-2 py-0.5 xxs:py-1 text-xs font-medium rounded transition-colors ${
                            task.videoUrl 
                              ? 'text-green-600 bg-green-50 hover:bg-green-100 cursor-pointer' 
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!task.videoUrl) e.preventDefault();
                          }}
                        >
                          <svg className="w-2.5 h-2.5 xxs:w-3 xxs:h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {task.videoUrl ? 'Video' : 'No Video'}
                        </a>
                      </div>
                    </div>

                    {/* Mobile Action Dropdown - Ultra Compact */}
                    {openDropdown === task.id && task.status !== 'Done' && (
                      <div className="mt-1.5 xxs:mt-2 xs:mt-3 pt-1.5 xxs:pt-2 xs:pt-3 border-t border-gray-100 flex gap-1 xxs:gap-1.5 xs:gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task);
                          }}
                          className="flex-1 bg-blue-50 text-blue-600 py-1 xxs:py-1.5 xs:py-2 px-1.5 xxs:px-2 xs:px-3 rounded xxs:rounded-md xs:rounded-lg text-xs xs:text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 xxs:gap-1.5"
                        >
                          <svg className="w-3 h-3 xxs:w-3 xxs:h-3 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden xxs:inline">Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(null);
                            handleDeleteTask(task.id);
                          }}
                          className="flex-1 bg-red-50 text-red-600 py-1 xxs:py-1.5 xs:py-2 px-1.5 xxs:px-2 xs:px-3 rounded xxs:rounded-md xs:rounded-lg text-xs xs:text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1 xxs:gap-1.5"
                        >
                          <svg className="w-3 h-3 xxs:w-3 xxs:h-3 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden xxs:inline">Del</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Empty State for All Tasks */}
              {filteredTasks.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Tasks Found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm || categoryFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria to see more tasks.'
                      : 'Get started by creating your first task for the team.'
                    }
                  </p>
                  {!searchTerm && categoryFilter === 'all' && (
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all inline-flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create First Task
                    </button>
                  )}
                </div>
              )}

            {/* Cleaning Logs Tab Content */}
            {(activeMainTab as MainTab) === 'cleaning-logs' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      🧽
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Cleaning Logs</h2>
                      <p className="text-sm text-gray-600">View cleaning history for all restaurant assets</p>
                    </div>
                  </div>

                  {/* Loading State */}
                  {loadingAssets && (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading assets...</p>
                    </div>
                  )}

                  {/* Assets Grid */}
                  {!loadingAssets && cleaningAssets.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cleaningAssets.map((asset) => (
                        <div
                          key={asset.asset_id}
                          onClick={() => fetchCleaningLogs(asset.asset_id)}
                          className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">{asset.asset_name}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {asset.total_tasks} logs
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Asset ID: {asset.asset_id}</p>
                            {asset.last_cleaned && (
                              <p className="text-green-600 mt-1">
                                Last cleaned: {new Date(asset.last_cleaned).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Assets State */}
                  {!loadingAssets && cleaningAssets.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        🧽
                      </div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Cleaning Assets Found</h3>
                      <p className="text-gray-500">No NFC cleaning assets have been registered yet.</p>
                    </div>
                  )}

                  {/* Cleaning Logs Details Modal */}
                  {selectedAsset && cleaningLogs && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-800">
                                {cleaningLogs.asset_name} - Cleaning History
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {cleaningLogs.date_range.days} days - {cleaningLogs.total_cleanings} total cleanings
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedAsset(null);
                                setCleaningLogs(null);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-96">
                          {loadingLogs ? (
                            <div className="text-center py-8">
                              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-gray-600">Loading cleaning logs...</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {Object.entries(cleaningLogs.logs_by_date).map(([date, logs]) => (
                                <div key={date}>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
                                    {formatDate(date)} ({logs.length} cleanings)
                                  </h4>
                                  <div className="space-y-2">
                                    {logs.map((log) => (
                                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                          <div className="font-medium text-gray-800">{log.staff_name}</div>
                                          <div className="text-sm text-gray-600">{log.method}</div>
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">
                                          {formatTime(log.completed_at)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              
                              {Object.keys(cleaningLogs.logs_by_date).length === 0 && (
                                <div className="text-center py-8">
                                  <p className="text-gray-500">No cleaning logs found for the selected period.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <AddTaskModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddTask={handleAddTask}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
          onTaskApprove={handleTaskApprove}
          onTaskDecline={handleTaskDecline}
        />
      )}
    </>
  );
};

export default AdminTaskPanel;
