import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Day, Category, Status } from '../../types';
import { CATEGORIES, DAYS } from '../../data/tasks';
import StatusBadge from '../common/StatusBadge';
import { ActionsIcon } from '../common/Icons';
import AddTaskModal from './AddTaskModal';
import TaskDetailModal from './TaskDetailModal';
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeView, setActiveView] = useState<Day | 'priority'>('monday');
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
    setActiveView(dayMap[dayIndex]);
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
    return filtered;
  }, [tasks, activeView, categoryFilter, searchTerm]);

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
    </>
  );
};

export default AdminTaskPanel;
