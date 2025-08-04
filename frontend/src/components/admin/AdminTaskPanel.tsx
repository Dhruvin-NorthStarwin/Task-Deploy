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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('all-tasks');
  const [activeView, setActiveView] = useState<Day | 'priority'>('monday');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
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
      ALLOWED_TAGS: [],
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
        setTasks(tasksData);
      } catch (error) {
        console.error('AdminTaskPanel: Failed to fetch tasks:', error);
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
    const filtered = tasks.filter(task => {
      const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter;
      const searchMatch = task.task.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!searchMatch || !categoryMatch) return false;
      
      if (activeView === 'priority') return task.taskType === 'Priority';
      return task.day === activeView;
    });
    
    return filtered;
  }, [tasks, activeView, categoryFilter, searchTerm]);

  const handleAddTask = async (newTasks: Omit<Task, 'id' | 'status'>[]) => {
    try {
      const addedTasks = await Promise.all(
        newTasks.map(task => apiService.createTask({
          task: task.task,
          category: task.category,
          day: task.day,
          taskType: task.taskType,
          description: task.description,
          imageRequired: task.imageRequired,
          videoRequired: task.videoRequired
        }))
      );
      
      setTasks(prevTasks => [...prevTasks, ...addedTasks]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Failed to add tasks:', error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: Status) => {
    try {
      await apiService.updateTaskStatus(taskId, newStatus);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleTaskApprove = async (taskId: number) => {
    await handleStatusChange(taskId, 'Done');
  };

  const handleTaskDecline = async (taskId: number, reason: string) => {
    try {
      await apiService.declineTask(taskId, reason);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: 'Declined' as Status } : task
        )
      );
    } catch (error) {
      console.error('Failed to decline task:', error);
    }
  };

  const toggleDropdown = (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === taskId ? null : taskId);
  };

  // Cleaning logs functions
  const fetchCleaningAssets = async () => {
    try {
      setLoadingAssets(true);
      const userData = localStorage.getItem('userData');
      if (!userData) {
        console.error('No user data found');
        return;
      }
      
      const user = JSON.parse(userData);
      const restaurantId = user.restaurant_id;
      
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
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen font-sans overflow-x-hidden">
        <div className="px-2 xxs:px-3 xs:px-4 sm:px-6 lg:px-8 py-3 xxs:py-4 sm:py-6 max-w-7xl mx-auto">
          
          {/* Header */}
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
                Add Task
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

          {/* Main Panel */}
          <div className="bg-white rounded-md xxs:rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            
            {/* Tab Navigation */}
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
                {/* Search and Filters */}
                <div className="p-2 xxs:p-3 xs:p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex flex-col space-y-2 xxs:space-y-3 xs:space-y-4">
                    
                    {/* Search Bar */}
                    <div className="relative">
                      <svg className="absolute left-2 xxs:left-2.5 xs:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 xxs:w-4 xxs:h-4 xs:w-5 xs:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input 
                        type="text" 
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-7 xxs:pl-8 xs:pl-10 pr-3 xxs:pr-4 py-2 xxs:py-2.5 sm:py-3 text-xs xxs:text-sm border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all"
                      />
                    </div>

                    {/* Category Filter */}
                    <div className="w-full">
                      <div className="flex gap-1 xxs:gap-1.5 xs:gap-2 overflow-x-auto pb-1.5 xxs:pb-2 sleek-scrollbar">
                        <button
                          onClick={() => setCategoryFilter('all')}
                          className={`flex-shrink-0 px-2.5 xxs:px-3 xs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm font-medium rounded-lg sm:rounded-xl transition-all ${
                            categoryFilter === 'all'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          All ({filteredTasks.length})
                        </button>
                        {CATEGORIES.map((category) => {
                          const categoryTasks = tasks.filter(task => {
                            const searchMatch = task.task.toLowerCase().includes(searchTerm.toLowerCase());
                            return searchMatch && task.category === category && (activeView === 'priority' ? task.taskType === 'Priority' : task.day === activeView);
                          });
                          
                          return (
                            <button
                              key={category}
                              onClick={() => setCategoryFilter(category)}
                              className={`flex-shrink-0 px-2.5 xxs:px-3 xs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm font-medium rounded-lg sm:rounded-xl transition-all whitespace-nowrap ${
                                categoryFilter === category
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {category} ({categoryTasks.length})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day Tabs */}
                <div className="bg-white border-b border-gray-200">
                  <div className="flex overflow-x-auto pb-0 scrollbar-none">
                    {[...DAYS, 'priority'].map((day) => (
                      <button
                        key={day}
                        onClick={() => setActiveView(day as Day | 'priority')}
                        className={`flex-shrink-0 px-3 xxs:px-4 sm:px-6 py-3 xxs:py-4 text-xs xxs:text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                          activeView === day
                            ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        {day === 'priority' ? (
                          <span className="flex items-center gap-1 xxs:gap-1.5">
                            ⚡ Priority
                          </span>
                        ) : (
                          day.charAt(0).toUpperCase() + day.slice(1)
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tasks Content */}
                <div className="p-3 xs:p-4 sm:p-6">
                  {filteredTasks.length > 0 ? (
                    <div className="space-y-2 xxs:space-y-3 sm:space-y-4">
                      {filteredTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="bg-white border border-gray-200 rounded-lg xxs:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-indigo-300 group"
                        >
                          <div className="p-3 xxs:p-4 sm:p-5">
                            <div className="flex flex-col space-y-2 xxs:space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 xxs:gap-3 mb-2 xxs:mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm xxs:text-base sm:text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 break-words">
                                      {sanitizeTaskContent(task.task)}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-1.5 xxs:gap-2 mt-1 xxs:mt-2">
                                      <span className="inline-flex items-center px-2 xxs:px-2.5 py-0.5 xxs:py-1 rounded-md xxs:rounded-lg text-xs xxs:text-sm font-medium bg-blue-100 text-blue-800">
                                        {task.category}
                                      </span>
                                      <span className="inline-flex items-center px-2 xxs:px-2.5 py-0.5 xxs:py-1 rounded-md xxs:rounded-lg text-xs xxs:text-sm font-medium bg-purple-100 text-purple-800">
                                        {task.day === activeView || activeView === 'priority' ? (
                                          activeView === 'priority' ? 'Priority' : task.day.charAt(0).toUpperCase() + task.day.slice(1)
                                        ) : (
                                          task.day.charAt(0).toUpperCase() + task.day.slice(1)
                                        )}
                                      </span>
                                      {task.taskType === 'Priority' && (
                                        <span className="inline-flex items-center px-2 xxs:px-2.5 py-0.5 xxs:py-1 rounded-md xxs:rounded-lg text-xs xxs:text-sm font-medium bg-red-100 text-red-800">
                                          ⚡ Priority
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-2 xxs:space-y-3">
                                <StatusBadge status={task.status} />
                                
                                <div className="relative">
                                  <button
                                    onClick={(e) => toggleDropdown(task.id, e)}
                                    className="p-1.5 xxs:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <ActionsIcon className="w-4 h-4 xxs:w-5 xxs:h-5 text-gray-500" />
                                  </button>
                                  
                                  {openDropdown === task.id && (
                                    <div className="absolute right-0 mt-1 xxs:mt-2 w-32 xxs:w-36 sm:w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 xxs:py-1.5 z-10">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTask(task);
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full text-left px-3 xxs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                      >
                                        View Details
                                      </button>
                                      {task.status === 'Submitted' && (
                                        <>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTaskApprove(task.id);
                                              setOpenDropdown(null);
                                            }}
                                            className="w-full text-left px-3 xxs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm text-green-700 hover:bg-green-50 transition-colors"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const reason = prompt('Please provide a reason for declining:');
                                              if (reason !== null && reason.trim() !== '') {
                                                handleTaskDecline(task.id, reason.trim());
                                              }
                                              setOpenDropdown(null);
                                            }}
                                            className="w-full text-left px-3 xxs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm text-red-700 hover:bg-red-50 transition-colors"
                                          >
                                            Decline
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 xxs:py-12 sm:py-16">
                      <div className="w-16 h-16 xxs:w-20 xxs:h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 xxs:mb-6">
                        <svg className="w-8 h-8 xxs:w-10 xxs:h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-base xxs:text-lg sm:text-xl font-medium text-gray-900 mb-2">
                        {searchTerm || categoryFilter !== 'all' ? 'No tasks match your filters' : 'No tasks yet'}
                      </h3>
                      <p className="text-sm xxs:text-base text-gray-500 mb-4 xxs:mb-6">
                        {searchTerm || categoryFilter !== 'all' 
                          ? 'Try adjusting your search or filter criteria'
                          : `No tasks have been created for ${activeView === 'priority' ? 'priority' : activeView} yet.`
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
                </div>
              </div>
            )}

            {/* Cleaning Logs Tab Content */}
            {activeMainTab === 'cleaning-logs' && (
              <div className="p-6 space-y-6">
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
                          <p>Last cleaned: {asset.last_cleaned || 'Never'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!loadingAssets && cleaningAssets.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      🧽
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Cleaning Assets Found</h3>
                    <p className="text-gray-500">No cleaning assets have been set up for this restaurant yet.</p>
                  </div>
                )}

                {/* Cleaning Logs Modal */}
                {selectedAsset && cleaningLogs && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">Cleaning History</h2>
                            <p className="text-sm text-gray-600">
                              Asset: {cleaningAssets.find(a => a.asset_id === selectedAsset)?.asset_name}
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                  {formatDate(date)}
                                </h3>
                                <div className="space-y-3">
                                  {logs.map((log, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-900">
                                          Cleaned at {formatTime(log.completed_at)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          by {log.staff_name}
                                        </span>
                                      </div>
                                      {log.method && (
                                        <p className="text-sm text-gray-600">Method: {log.method}</p>
                                      )}
                                      {log.time && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Duration: {log.time}
                                        </p>
                                      )}
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

      {/* Modals */}
      {isAddModalOpen && (
        <AddTaskModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddTask={handleAddTask}
        />
      )}

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
