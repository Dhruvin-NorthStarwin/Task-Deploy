import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Day, Category, Status } from '../../types';
import { CATEGORIES, DAYS } from '../../data/tasks';
import StatusBadge from '../common/StatusBadge';
import AddTaskModal from './AddTaskModal';
import TaskDetailModal from './TaskDetailModal';
import apiService from '../../services/apiService';

interface AdminTaskPanelProps {
  onLogout: () => void;
}

const AdminTaskPanel: React.FC<AdminTaskPanelProps> = ({ onLogout }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeDay, setActiveDay] = useState<Day | 'priority'>('monday');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

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
    }
  };

  // Toggle dropdown for task actions
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
    setActiveDay(dayMap[dayIndex]);
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
    console.log('AdminTaskPanel: Active day:', activeDay);
    console.log('AdminTaskPanel: Category filter:', categoryFilter);
    console.log('AdminTaskPanel: Search term:', searchTerm);
    
    const filtered = tasks.filter(task => {
      const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter;
      const searchMatch = task.task.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!searchMatch || !categoryMatch) return false;
      
      if (activeDay === 'priority') return task.taskType === 'Priority';
      return task.day === activeDay;
    });
    
    console.log('AdminTaskPanel: Filtered tasks:', filtered.length);
    return filtered;
  }, [tasks, activeDay, categoryFilter, searchTerm]);

  const handleAddTask = async (newTasks: Omit<Task, 'id' | 'status'>[]) => {
    try {
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
      
      if (createdTasks.length > 0) {
        setTasks(prevTasks => [...prevTasks, ...createdTasks]);
        console.log('AdminTaskPanel: Added tasks to state:', createdTasks.length);
      }
      
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('AdminTaskPanel: Error in handleAddTask:', error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: Status) => {
    try {
      console.log('Changing task status:', taskId, 'to:', newStatus);
      const updatedTask = await apiService.updateTaskStatus(taskId, newStatus);
      console.log('Task status updated successfully:', updatedTask);
      
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, status: updatedTask.status } : t
      ));
      
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: updatedTask.status });
      }
      
      setOpenDropdown(null);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleTaskApprove = async (taskId: number) => {
    try {
      console.log('Approving task:', taskId);
      const updatedTask = await apiService.approveTask(taskId);
      console.log('Task approved successfully:', updatedTask);
      
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
      console.log('Declining task:', taskId, 'with reason:', reason);
      const updatedTask = await apiService.declineTask(taskId, reason);
      console.log('Task declined successfully:', updatedTask);
      
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, status: updatedTask.status, declineReason: reason } : t
      ));
      
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: updatedTask.status, declineReason: reason });
      }
    } catch (error) {
      console.error('Failed to decline task:', error);
    }
  };

  return (
    <>
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
        .active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
      
      {/* Mobile-First Layout with Enhanced UI */}
      <div className="bg-gray-50 min-h-screen">
        
        {/* Mobile Header */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <button 
              onClick={onLogout}
              className="p-2 text-red-500"
              aria-label="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          <p className="text-gray-500 text-sm">Manage and oversee all restaurant tasks</p>
          <div className="flex mt-3 gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-sm rounded-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add
            </button>
            <button 
              onClick={fetchTasks}
              className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </header>

        {/* Desktop Header (Keeping for backward compatibility) */}
        <div className="hidden lg:flex justify-between items-center mb-6 p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage and oversee all restaurant tasks</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Task
            </button>
            <button 
              onClick={onLogout}
              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Search and Filters - Enhanced Mobile UI */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 overflow-hidden">
              {/* Search Bar */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
              
              {/* Day Filter */}
              <div className="p-2 border-b border-gray-100">
                <div className="flex items-center overflow-x-auto sleek-scrollbar snap-x snap-mandatory -mx-1">
                  <button
                    onClick={() => setActiveDay('priority')}
                    className={`flex-shrink-0 snap-start px-4 py-2 text-sm font-medium rounded-md ${
                      activeDay === 'priority' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    } mx-1 min-w-[80px] text-center`}
                  >
                    Priority
                  </button>
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => setActiveDay(day)}
                      className={`flex-shrink-0 snap-start px-4 py-2 text-sm font-medium rounded-md capitalize ${
                        activeDay === day 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      } mx-1 min-w-[80px] text-center`}
                    >
                      {/* Show abbreviated day names on mobile */}
                      <span className="block xs:hidden">{day.substring(0, 3)}</span>
                      <span className="hidden xs:block">{day}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="p-2">
                <div className="flex items-center overflow-x-auto sleek-scrollbar snap-x snap-mandatory -mx-1">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`flex-shrink-0 snap-start px-4 py-2 text-sm font-medium rounded-md ${
                      categoryFilter === 'all' 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    } mx-1 min-w-[80px] text-center`}
                  >
                    All
                  </button>
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                      className={`flex-shrink-0 snap-start px-4 py-2 text-sm font-medium rounded-md ${
                        categoryFilter === category 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      } mx-1 min-w-[80px] text-center`}
                    >
                      {/* Show abbreviated category names on mobile */}
                      <span className="block xs:hidden">
                        {category.length > 3 ? category.substring(0, 3) + '..' : category}
                      </span>
                      <span className="hidden xs:block">
                        {category.length > 8 ? category.substring(0, 6) + '...' : category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {filteredTasks.length > 0 ? (
                <>
                  {/* Mobile Cards - Styled according to the layout design */}
                  <div className="md:hidden space-y-3">
                    {filteredTasks.map(task => (
                      <div 
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer active:scale-98 transition-transform"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full mt-1.5 ${
                              task.status === 'Done' ? 'bg-green-500' :
                              task.status === 'Declined' ? 'bg-red-500' :
                              task.status === 'Submitted' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`}></span>
                            <p className="font-medium text-gray-800 line-clamp-1">{task.task}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(task.id, e);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            aria-label="Task options"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="12" cy="5" r="1"></circle>
                              <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                          </button>
                        </div>
                        
                        <div className="mt-3 pt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs">
                              {task.initials ? task.initials.toUpperCase() : '?'}
                            </div>
                            <span>{task.initials || 'Unknown'}</span>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                      </div>
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
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                  </svg>
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
                <div className="text-center py-10 px-4 bg-white rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700">No tasks found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your filters or search term.</p>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Add First Task
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
        
        {/* Floating Action Button (Mobile) */}
        <div className="md:hidden fixed bottom-4 right-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            aria-label="Add Task"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
          </button>
        </div>

        {/* Task Actions Dropdown - Optimized for mobile */}
        {openDropdown !== null && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-5" onClick={() => setOpenDropdown(null)}>
            <div 
              className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48"
              style={{
                top: `${dropdownPosition.top}px`,
                left: Math.min(dropdownPosition.left, window.innerWidth - 192),
                maxWidth: 'calc(100% - 24px)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => openDropdown !== null && handleStatusChange(openDropdown, 'Submitted')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-blue-600 font-medium text-sm"
              >
                Mark as In Progress
              </button>
              <button 
                onClick={() => openDropdown !== null && handleStatusChange(openDropdown, 'Done')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-green-600 font-medium text-sm"
              >
                Mark as Done
              </button>
              <button 
                onClick={() => setOpenDropdown(null)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
              <button 
                onClick={() => {
                  if (openDropdown !== null) {
                    handleStatusChange(openDropdown, 'Done');
                  }
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-green-600 font-medium"
              >
                ✓ Mark as Done
              </button>
              <button 
                onClick={() => {
                  if (openDropdown !== null) {
                    handleStatusChange(openDropdown, 'Declined');
                  }
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-red-600 font-medium"
              >
                ✗ Mark as Declined
              </button>
      </div>
    </>
  );
};

export default AdminTaskPanel;
