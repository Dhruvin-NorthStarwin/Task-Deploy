import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Day, Category, Status } from '../../types';
import { CATEGORIES, DAYS } from '../../data/tasks';
import StatusBadge from '../common/StatusBadge';
import { ActionsIcon } from '../common/Icons';
import AddTaskModal from './AddTaskModal';
import TaskDetailModal from './TaskDetailModal';
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

  const tabButtonBase = "flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-200";
  const tabButtonInactive = "border-b-2 border-transparent text-gray-500 hover:text-gray-700";
  const tabButtonActive = "border-b-2 border-indigo-600 text-indigo-600 font-semibold bg-white rounded-t-lg shadow-sm";

  const filterButtonBase = "flex-shrink-0 px-4 py-2 text-sm rounded-lg border transition-all duration-200 font-semibold";
  const filterButtonInactive = "bg-white/[.64] text-gray-700 border-gray-300 hover:border-gray-400 hover:text-gray-800 shadow-sm";
  const filterButtonActive = "bg-indigo-600/[.98] text-white border-transparent shadow-lg";

  return (
    <>
      {/* Logout button is rendered here. Remove if already rendered elsewhere. */}
      <style>{`
        .sleek-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .sleek-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sleek-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .sleek-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .sleek-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
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
      <div className="bg-gray-50 min-h-screen font-sans">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Task Management</h1>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="w-full md:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm hover:shadow-md"
              >
                + Add Task
              </button>
              <button 
                onClick={onLogout} 
                className="w-full md:w-auto bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="relative w-full md:flex-grow md:max-w-xs">
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" 
                />
              </div>
              <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-4">
                {/* Dropdowns removed as requested */}
              </div>
            </div>
            <div className="border-b border-gray-200">
              <div className="flex -mb-px items-center gap-4 overflow-x-auto sleek-scrollbar">
                <button 
                  onClick={() => setActiveView('priority')} 
                  className={`${tabButtonBase} ${activeView === 'priority' ? tabButtonActive : tabButtonInactive}`}
                >
                  Priority Task
                </button>
                {DAYS.map(day => (
                  <button 
                    key={day} 
                    onClick={() => setActiveView(day)} 
                    className={`${tabButtonBase} capitalize ${activeView === day ? tabButtonActive : tabButtonInactive}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-3 sleek-scrollbar">
              <button 
                onClick={() => setCategoryFilter('all')} 
                className={`${filterButtonBase} ${categoryFilter === 'all' ? filterButtonActive : filterButtonInactive}`}
              >
                All Tasks
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setCategoryFilter(cat)} 
                  className={`${filterButtonBase} ${categoryFilter === cat ? filterButtonActive : filterButtonInactive}`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold">Task</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Initials</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map(task => (
                    <tr 
                      key={task.id} 
                      onClick={() => setSelectedTask(task)} 
                      className={`cursor-pointer transition-colors ${
                        task.status === 'Done' 
                          ? 'bg-gray-50 opacity-60 hover:bg-gray-100' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className={`px-6 py-5 font-medium ${
                        task.status === 'Done' 
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-900'
                      }`}>
                        {task.task}
                      </td>
                      <td className={`px-6 py-5 ${
                        task.status === 'Done' 
                          ? 'text-gray-400' 
                          : 'text-gray-600'
                      }`}>
                        {task.initials || '-'}
                      </td>
                      <td className="px-6 py-5"><StatusBadge status={task.status} /></td>
                      <td className="px-6 py-5 text-center">
                        <div className="relative">
                          <button 
                            className={`p-2 rounded-full ${
                              task.status === 'Done'
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-800'
                            }`}
                            onClick={(e) => {
                              if (task.status !== 'Done') {
                                toggleDropdown(task.id, e);
                              }
                            }}
                            disabled={task.status === 'Done'}
                            title={task.status === 'Done' ? 'Task completed - no actions available' : 'View task actions'}
                          >
                            <ActionsIcon className="w-5 h-5" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openDropdown === task.id && task.status !== 'Done' && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                              <button
                                onClick={() => handleEditTask(task)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  handleDeleteTask(task.id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2"
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
                <div className="text-center p-16 text-gray-500">
                  <h3 className="text-lg font-semibold">No Tasks Found</h3>
                  <p className="mt-1">Try adjusting your search or filter criteria.</p>
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
