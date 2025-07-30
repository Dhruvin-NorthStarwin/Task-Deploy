import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Day, Category, Status } from '../../types';
import { CATEGORIES, DAYS } from '../../data/tasks';
import StatusBadge from '../common/StatusBadge';
import { ActionsIcon } from '../common/Icons';
import AddTaskModal from './AddTaskModal';
import TaskDetailModal from './TaskDetailModal';
import PWAInstallButton from '../common/PWAInstallButton';
import MobileHeader from '../common/MobileHeader';
import MobileSearchFilter from '../common/MobileSearchFilter';
import MobileTaskCard from '../common/MobileTaskCard';
import FloatingActionButton from '../common/FloatingActionButton';
import apiService from '../../services/apiService';

interface AdminTaskPanelProps {
  onLogout: () => void;
}

const AdminTaskPanel: React.FC<AdminTaskPanelProps> = ({ onLogout }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]); // Start with empty tasks
  const [activeView, setActiveView] = useState<Day | 'priority'>('monday');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  // const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all'); // Removed unused variable
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Add fetchTasks function
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

  // Add toggleDropdown function
  const toggleDropdown = (taskId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (openDropdown === taskId) {
      setOpenDropdown(null);
      return;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 5,
      left: Math.min(rect.left + window.scrollX, window.innerWidth - 200)
    });
    
    setOpenDropdown(taskId);
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
        }
      }
      
      // Add the newly created tasks to the state
      if (createdTasks.length > 0) {
        setTasks(prevTasks => [...prevTasks, ...createdTasks]);
        console.log('Tasks created successfully:', createdTasks);
      } else {
        throw new Error('No tasks were created successfully');
      }
    } catch (error) {
      console.error('Failed to create tasks:', error);
      
      // Always create tasks locally to ensure UI keeps working
      console.log('Creating tasks locally as fallback');
      const newTasksWithIds = newTasks.map((task, index) => ({
        ...task,
        id: Date.now() + index,
        // initials: Admin initials after assignment
        status: 'Unknown' as Status,
      }));
      setTasks(prevTasks => [...prevTasks, ...newTasksWithIds]);
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
      
      // Update tasks in the UI
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, status: updatedTask.status } : t
      ));
      
      // Update selected task if it's the one being approved
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: updatedTask.status });
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
      
      // Update tasks in the UI
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, status: updatedTask.status } : t
      ));
      
      // Update selected task if it's the one being declined
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

  return (
    <>
      {/* Custom styles for responsive design */}
      <style>{`
        .sleek-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .sleek-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sleek-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .sleek-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .sleek-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
        
        /* Mobile-first table responsive design */
        @media (max-width: 768px) {
          .mobile-table {
            border: 0;
          }
          .mobile-table thead {
            display: none;
          }
          .mobile-table tr {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            display: block;
            margin-bottom: 12px;
            padding: 16px;
            background: white;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          .mobile-table td {
            border: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .mobile-table td:last-child {
            border-bottom: none;
          }
          .mobile-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #6b7280;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
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

      {/* Enhanced Mobile Scrollbar Styles */}
      <style>{`
        .sleek-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .sleek-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sleek-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e2e8f0;
          border-radius: 10px;
        }
        .sleek-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #cbd5e1;
        }
        .sleek-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }
        .active\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
      
      {/* Mobile-first responsive layout */}
      <div className="bg-gray-50 min-h-screen font-sans mobile-optimized">
        
        {/* Enhanced Mobile Header */}
        <MobileHeader 
          title="Admin Dashboard"
          subtitle="Manage and oversee all restaurant tasks"
          onLogout={onLogout}
          onAddTask={() => setIsAddModalOpen(true)}
          onRefresh={fetchTasks}
          showAddButton={true}
          showRefreshButton={true}
        />

        {/* Main Content */}
        <main className="p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Enhanced Search and Filters */}
            <MobileSearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              activeDay={activeView}
              onDayChange={setActiveView}
              activeCategory={categoryFilter}
              onCategoryChange={setCategoryFilter}
            />

            {/* Task List with Enhanced Mobile Cards */}
            <div className="space-y-3 mobile:space-y-4">
              {filteredTasks.length > 0 ? (
                <>
                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {filteredTasks.map(task => (
                      <MobileTaskCard
                        key={task.id}
                        task={task}
                        onTaskClick={setSelectedTask}
                        onActionClick={toggleDropdown}
                        showActions={true}
                      />
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full bg-white rounded-lg shadow-sm border border-gray-100">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Task</th>
                          <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                          <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Assigned To</th>
                          <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTasks.map(task => (
                          <tr 
                            key={task.id} 
                            onClick={() => setSelectedTask(task)} 
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  task.taskType === 'Priority' ? 'bg-red-400' : 'bg-blue-400'
                                }`}></div>
                                <span className="font-medium text-gray-900">{task.task}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 capitalize">{task.category}</td>
                            <td className="px-6 py-4">
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
                                <span className="text-gray-600">{task.initials || 'Unassigned'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={task.status} />
                            </td>
                            <td className="px-6 py-4">
                              {task.status !== 'Done' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDropdown(task.id, e);
                                  }}
                                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <ActionsIcon className="w-5 h-5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 px-4 bg-white rounded-mobile shadow-sm">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="mobile-title font-semibold text-gray-700 mb-1">No tasks found</h3>
                  <p className="mobile-subtitle text-gray-500">Try adjusting your filters or search term.</p>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-mobile font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Add First Task
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
        
        {/* Floating Action Button for Mobile */}
        <FloatingActionButton 
          onClick={() => setIsAddModalOpen(true)}
          label="Add Task"
        />

        {/* Dropdown Menu */}
        {openDropdown && (
          <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}>
            <div 
              className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-40"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => handleStatusChange(openDropdown, 'Submitted')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-blue-600 font-medium"
              >
                ✓ Mark as Submitted
              </button>
              <button 
                onClick={() => handleStatusChange(openDropdown, 'Done')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-green-600 font-medium"
              >
                ✓ Mark as Done
              </button>
              <button 
                onClick={() => handleStatusChange(openDropdown, 'Declined')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-red-600 font-medium"
              >
                ✗ Mark as Declined
              </button>
            </div>
          </div>
        )}
      </div>
                      <span className="hidden xs:inline">🔥 Priority</span>
                      <span className="xs:hidden">🔥</span>
                    </button>
                    {DAYS.map(day => (
                      <button 
                        key={day} 
                        onClick={() => setActiveView(day)} 
                        className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg capitalize transition-all duration-200 min-w-max ${
                          activeView === day 
                            ? 'bg-indigo-500 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.slice(0, 3)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filters - Enhanced mobile layout */}
                <div className="px-2 sm:px-4 pb-3 sm:pb-4">
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <button 
                      onClick={() => setCategoryFilter('all')} 
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 min-w-max ${
                        categoryFilter === 'all' 
                          ? 'bg-gray-800 text-white shadow-md' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="hidden xs:inline">All Categories</span>
                      <span className="xs:hidden">All</span>
                    </button>
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setCategoryFilter(cat)} 
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 min-w-max ${
                          categoryFilter === cat 
                            ? 'bg-green-500 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span className="hidden sm:inline">{cat}</span>
                        <span className="sm:hidden">{cat.length > 8 ? cat.slice(0, 6) + '...' : cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Display - Responsive table/cards */}
            <div className="p-4 sm:p-6">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider rounded-lg">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-semibold rounded-l-lg">Task</th>
                      <th scope="col" className="px-6 py-4 font-semibold">Assigned To</th>
                      <th scope="col" className="px-6 py-4 font-semibold">Status</th>
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

              {/* Mobile Cards - Enhanced for small screens */}
              <div className="md:hidden space-y-3 mobile:space-y-4">
                {filteredTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`mobile-task-card mobile-card cursor-pointer ${
                      task.status === 'Done' ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Task Header */}
                    <div className="flex items-start justify-between mb-2 mobile:mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            task.taskType === 'Priority' ? 'bg-red-400' : 'bg-blue-400'
                          }`}></div>
                          <span className="mobile-caption font-semibold uppercase tracking-wide truncate">
                            {task.category}
                          </span>
                        </div>
                        <h3 className={`mobile-task-title ${
                          task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.task}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <StatusBadge status={task.status} />
                        {task.status !== 'Done' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(task.id, e);
                            }}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors min-h-touch min-w-touch"
                          >
                            <ActionsIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Task Details */}
                    <div className="mobile-task-meta flex items-center justify-between text-gray-600">
                      <div className="flex items-center gap-2">
                        {task.initials ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold">
                            {task.initials}
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs">
                            ?
                          </div>
                        )}
                        <span>{task.initials || 'Unassigned'}</span>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">
                        {task.day === activeView ? 'Today' : task.day}
                      </span>
                    </div>

                    {/* Mobile Action Dropdown */}
                    {openDropdown === task.id && task.status !== 'Done' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task);
                          }}
                          className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(null);
                            handleDeleteTask(task.id);
                          }}
                          className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Empty State */}
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminTaskPanel;
