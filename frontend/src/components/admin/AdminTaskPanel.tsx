import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Day, Category, Status } from '../../types';
import { CATEGORIES, DAYS } from '../../data/tasks';
import StatusBadge from '../common/StatusBadge';
import { ActionsIcon } from '../common/Icons';
import AddTaskModal from './AddTaskModal';
import TaskDetailModal from './TaskDetailModal';
import PWAInstallButton from '../common/PWAInstallButton';
import apiService from '../../services/apiService';

interface AdminTaskPanelProps {
  onLogout: () => void;
}

const AdminTaskPanel: React.FC<AdminTaskPanelProps> = ({ onLogout }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeView, setActiveView] = useState<Day | 'priority'>('monday');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  useEffect(() => {
    const dayIndex = (new Date().getDay() + 6) % 7;
    const dayMap: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    setActiveView(dayMap[dayIndex]);
    
    const fetchTasks = async () => {
      try {
        const tasksData = await apiService.getTasks();
        setTasks(tasksData);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };
    
    fetchTasks();
  }, []);

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

  const filteredTasks = useMemo(() => {
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
      const createdTasks: Task[] = [];
      
      for (const task of newTasks) {
        try {
          const createdTask = await apiService.createTask(task);
          createdTasks.push(createdTask);
        } catch (error) {
          console.error('Error creating single task:', error);
        }
      }
      
      if (createdTasks.length > 0) {
        setTasks(prevTasks => [...prevTasks, ...createdTasks]);
      }
    } catch (error) {
      console.error('Failed to add tasks:', error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: Status) => {
    try {
      const updatedTask = await apiService.updateTaskStatus(taskId, newStatus);
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, status: updatedTask.status } : t
      ));
      
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: updatedTask.status });
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleTaskApprove = async (taskId: number) => {
    try {
      const updatedTask = await apiService.approveTask(taskId);
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, status: updatedTask.status } : t
      ));
      
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: updatedTask.status });
      }
    } catch (error) {
      console.error('Failed to approve task:', error);
    }
  };

  const handleTaskDecline = async (taskId: number, reason: string) => {
    try {
      const updatedTask = await apiService.declineTask(taskId, reason);
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, status: updatedTask.status } : t
      ));
      
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: updatedTask.status });
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
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
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

  return (
    <>
      {/* Mobile-responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-table-card {
            display: block !important;
          }
          .mobile-scroll-tabs {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .mobile-scroll-tabs::-webkit-scrollbar {
            display: none;
          }
        }
        
        .touch-target {
          min-height: 44px;
          min-width: 44px;
        }
        
        .card-shadow {
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        
        .card-shadow:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
      `}</style>
      
      <AddTaskModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAddTask={handleAddTask} 
      />
      <TaskDetailModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
        onStatusChange={handleStatusChange} 
        onTaskApprove={handleTaskApprove}
        onTaskDecline={handleTaskDecline}
      />
      
      {/* Mobile-first responsive layout */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-5 sm:py-6 max-w-7xl mx-auto">
          
          {/* 1. Header Section (Mobile) - Stacked layout */}
          <div className="mb-6 xs:mb-7 sm:mb-8">
            {/* Title Section */}
            <div className="text-center sm:text-left mb-4 xs:mb-5 sm:mb-6">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 xs:mb-3">
                Admin Dashboard
              </h1>
              <p className="text-sm xs:text-base sm:text-lg text-gray-600 font-medium">
                Manage and oversee all restaurant tasks
              </p>
            </div>
            
            {/* Full-width buttons: Actions take full width on mobile */}
            <div className="space-y-3 xs:space-y-4 sm:space-y-0 sm:flex sm:gap-3 lg:gap-4">
              <div className="w-full sm:w-auto">
                <PWAInstallButton />
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 xs:px-8 py-4 xs:py-5 sm:py-3 rounded-xl font-bold text-base xs:text-lg sm:text-base focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 touch-target"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Task
              </button>
              <button 
                onClick={onLogout} 
                className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 xs:px-8 py-4 xs:py-5 sm:py-3 rounded-xl font-bold text-base xs:text-lg sm:text-base focus:outline-none focus:ring-4 focus:ring-red-300 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 touch-target"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Main Panel */}
          <div className="bg-white rounded-xl xs:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            
            {/* 2. Filters Section (Mobile) - Column layout */}
            <div className="p-4 xs:p-5 sm:p-6 bg-gray-50/70 border-b border-gray-200">
              <div className="space-y-4 xs:space-y-5">
                
                {/* Full-width inputs: Search input spans full width */}
                <div className="relative">
                  <svg className="absolute left-4 xs:left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 xs:w-6 xs:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-12 xs:pl-14 pr-4 xs:pr-5 py-4 xs:py-5 sm:py-4 border-2 border-gray-200 rounded-xl xs:rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 transition-all bg-white shadow-sm text-base xs:text-lg font-medium touch-target" 
                  />
                </div>

                {/* 3. Navigation Tabs (Mobile) - Horizontal scroll */}
                <div>
                  <h3 className="text-sm xs:text-base font-bold text-gray-700 mb-3 xs:mb-4">Filter by Day</h3>
                  <div className="flex gap-2 xs:gap-3 overflow-x-auto pb-2 mobile-scroll-tabs">
                    <button 
                      onClick={() => setActiveView('priority')} 
                      className={`flex-shrink-0 px-4 xs:px-5 py-3 xs:py-4 text-sm xs:text-base font-bold rounded-xl transition-all duration-200 flex items-center gap-2 xs:gap-3 touch-target ${
                        activeView === 'priority' 
                          ? 'bg-red-500 text-white shadow-lg' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border-2 border-gray-200'
                      }`}
                    >
                      <span className="text-lg xs:text-xl">🔥</span>
                      <span>Priority</span>
                    </button>
                    {DAYS.map(day => (
                      <button 
                        key={day} 
                        onClick={() => setActiveView(day)} 
                        className={`flex-shrink-0 px-4 xs:px-5 py-3 xs:py-4 text-sm xs:text-base font-bold rounded-xl capitalize transition-all duration-200 touch-target ${
                          activeView === day 
                            ? 'bg-indigo-500 text-white shadow-lg' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 border-2 border-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Touch-friendly selects: Category filters */}
                <div>
                  <h3 className="text-sm xs:text-base font-bold text-gray-700 mb-3 xs:mb-4">Filter by Category</h3>
                  <div className="flex flex-wrap gap-2 xs:gap-3">
                    <button 
                      onClick={() => setCategoryFilter('all')} 
                      className={`px-4 xs:px-5 py-3 xs:py-4 text-sm xs:text-base font-bold rounded-xl transition-all duration-200 touch-target ${
                        categoryFilter === 'all' 
                          ? 'bg-gray-800 text-white shadow-lg' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border-2 border-gray-200'
                      }`}
                    >
                      All Categories
                    </button>
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setCategoryFilter(cat)} 
                        className={`px-4 xs:px-5 py-3 xs:py-4 text-sm xs:text-base font-bold rounded-xl transition-all duration-200 touch-target ${
                          categoryFilter === cat 
                            ? 'bg-green-500 text-white shadow-lg' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 border-2 border-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Task Display - Mobile cards / Desktop table */}
            <div className="p-4 xs:p-5 sm:p-6">
              
              {/* Mobile Card Layout */}
              <div className="block lg:hidden">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 xs:py-16">
                    <div className="text-6xl xs:text-7xl mb-4 xs:mb-6">📋</div>
                    <p className="text-gray-500 text-lg xs:text-xl font-bold mb-2">No tasks found</p>
                    <p className="text-gray-400 text-base xs:text-lg">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="space-y-4 xs:space-y-5">
                    {filteredTasks.map(task => (
                      <div 
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`bg-white border-2 border-gray-200 rounded-xl xs:rounded-2xl p-4 xs:p-5 card-shadow transition-all duration-200 cursor-pointer ${
                          task.status === 'Done' ? 'opacity-60 bg-gray-50' : 'hover:border-indigo-300'
                        }`}
                      >
                        {/* Task Header */}
                        <div className="flex items-start justify-between mb-3 xs:mb-4">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2 xs:gap-3 mb-2">
                              <div className={`w-3 h-3 xs:w-4 xs:h-4 rounded-full ${
                                task.taskType === 'Priority' ? 'bg-red-400' : 'bg-blue-400'
                              }`}></div>
                              <span className="text-xs xs:text-sm font-bold text-gray-500 uppercase tracking-wider">
                                {task.category}
                              </span>
                            </div>
                            <h3 className={`text-base xs:text-lg font-bold leading-tight ${
                              task.status === 'Done' 
                                ? 'text-gray-500 line-through' 
                                : 'text-gray-900'
                            }`}>
                              {task.task}
                            </h3>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>

                        {/* Task Info */}
                        <div className="flex items-center justify-between pt-3 xs:pt-4 border-t-2 border-gray-100">
                          <div className="flex items-center gap-3 xs:gap-4">
                            {task.initials ? (
                              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm xs:text-base font-bold">
                                {task.initials}
                              </div>
                            ) : (
                              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-sm xs:text-base font-bold">
                                ?
                              </div>
                            )}
                            <div>
                              <p className="text-sm xs:text-base font-bold text-gray-700">
                                {task.initials || 'Unassigned'}
                              </p>
                              <p className="text-xs xs:text-sm text-gray-500 font-medium capitalize">
                                {task.day}
                              </p>
                            </div>
                          </div>
                          
                          {task.status !== 'Done' && (
                            <div className="relative">
                              <button 
                                className="p-3 xs:p-4 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all touch-target"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(task.id, e);
                                }}
                              >
                                <ActionsIcon className="w-5 h-5 xs:w-6 xs:h-6" />
                              </button>
                              
                              {openDropdown === task.id && (
                                <div className="absolute right-0 top-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl z-20 min-w-[180px] overflow-hidden">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTask(task);
                                    }}
                                    className="w-full px-5 py-4 text-left text-base font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-4 transition-colors touch-target"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Task
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdown(null);
                                      handleDeleteTask(task.id);
                                    }}
                                    className="w-full px-5 py-4 text-left text-base font-bold text-red-600 hover:bg-red-50 flex items-center gap-4 transition-colors touch-target"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop Table - Horizontal scroll */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border-2 border-gray-200">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th scope="col" className="px-6 py-4 font-semibold">Task</th>
                        <th scope="col" className="px-6 py-4 font-semibold">Assigned To</th>
                        <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                        <th scope="col" className="px-6 py-4 font-semibold text-center">Actions</th>
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
                            <div className="relative">
                              <button 
                                className={`p-2 rounded-full transition-all ${
                                  task.status === 'Done'
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-800'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTask(task);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Task
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
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

                  {filteredTasks.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📋</div>
                      <p className="text-gray-500 text-xl font-medium">No tasks found</p>
                      <p className="text-gray-400 text-base mt-2">Try adjusting your filters or add a new task</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminTaskPanel;
