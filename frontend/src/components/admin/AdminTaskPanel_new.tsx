import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Day, Category, Status } from '../../types';
import StatusBadge from '../common/StatusBadge';
import AddTaskModal from './AddTaskModal';
import TaskDetailModal from './TaskDetailModal';
import apiService from '../../services/apiService';

interface AdminTaskPanelProps {
  onLogout: () => void;
}

// --- HELPER ICONS ---
const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const MoreVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

type MainFilter = Day | 'priority';

// Task Item Component - handles both mobile and desktop views
const TaskItem = ({ 
  task, 
  onSelect, 
  onStatusChange,
  onTaskApprove,
  onTaskDecline,
  openDropdown,
  onToggleDropdown
}: { 
  task: Task; 
  onSelect: (task: Task) => void;
  onStatusChange: (taskId: number, newStatus: Status) => void;
  onTaskApprove: (taskId: number) => void;
  onTaskDecline: (taskId: number, reason: string) => void;
  openDropdown: number | null;
  onToggleDropdown: (taskId: number, event: React.MouseEvent) => void;
}) => {
  const handleDeclineTask = () => {
    const reason = prompt('Please provide a reason for declining this task:');
    if (reason && reason.trim()) {
      onTaskDecline(task.id, reason.trim());
    }
  };

  return (
    <div className="w-full block lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 lg:p-2 lg:shadow-none lg:border-b lg:rounded-none cursor-pointer hover:bg-gray-50">
      {/* Mobile Layout */}
      <div className="lg:hidden" onClick={() => onSelect(task)}>
        {/* Task Name and Status Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <span className={`h-2.5 w-2.5 rounded-full ${task.status === 'Declined' ? 'bg-red-500' : task.status === 'Done' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <p className="font-semibold text-gray-800 flex-1">{task.task}</p>
          </div>
          <StatusBadge status={task.status} />
        </div>
        
        {/* Initials Below Task Title */}
        <div className="flex items-center gap-2 text-sm text-gray-500 ml-5">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs">
            {task.initials ? task.initials.toUpperCase() : '?'}
          </div>
          <span>{task.initials || 'Unassigned'}</span>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:contents">
        {/* Task Name (Desktop) */}
        <div className="lg:col-span-5 flex items-center gap-3" onClick={() => onSelect(task)}>
          <span className={`h-2.5 w-2.5 rounded-full ${task.status === 'Declined' ? 'bg-red-500' : task.status === 'Done' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          <p className="font-semibold text-gray-800">{task.task}</p>
        </div>
        
        {/* Assigned To (Desktop) */}
        <div className="lg:col-span-2 flex items-center gap-2 text-sm text-gray-500" onClick={() => onSelect(task)}>
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs">
            {task.initials ? task.initials.toUpperCase() : '?'}
          </div>
          <span>{task.initials || 'Unassigned'}</span>
        </div>

        {/* Day (Desktop only) */}
        <div className="lg:col-span-2 text-sm text-gray-600 capitalize" onClick={() => onSelect(task)}>{task.day}</div>
        
        {/* Status (Desktop only) */}
        <div className="lg:col-span-2" onClick={() => onSelect(task)}><StatusBadge status={task.status} /></div>

        {/* Actions (Desktop only) */}
        <div className="lg:col-span-1 flex justify-end relative">
          <button 
            onClick={(e) => onToggleDropdown(task.id, e)} 
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <MoreVerticalIcon className="h-5 w-5" />
          </button>
          
          {/* Dropdown Menu */}
          {openDropdown === task.id && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                {task.status === 'Submitted' && (
                  <>
                    <button
                      onClick={() => onTaskApprove(task.id)}
                      className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                    >
                      Approve Task
                    </button>
                    <button
                      onClick={handleDeclineTask}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Decline Task
                    </button>
                  </>
                )}
                <button
                  onClick={() => onStatusChange(task.id, 'Unknown')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Reset Status
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminTaskPanel: React.FC<AdminTaskPanelProps> = ({ onLogout }) => {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMainFilter, setActiveMainFilter] = useState<MainFilter>('monday');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Initialize with current day
  useEffect(() => {
    const dayIndex = (new Date().getDay() + 6) % 7;
    const dayMap: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    setActiveMainFilter(dayMap[dayIndex]);
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

  // API Integration
  const fetchTasks = async () => {
    try {
      const tasksData = await apiService.getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('AdminTaskPanel: Failed to fetch tasks:', error);
    }
  };

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
      
      setAddTaskModalOpen(false);
    } catch (error) {
      console.error('AdminTaskPanel: Error in handleAddTask:', error);
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
      
      setOpenDropdown(null);
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
      
      setOpenDropdown(null);
    } catch (error) {
      console.error('Failed to approve task:', error);
    }
  };

  const handleTaskDecline = async (taskId: number, reason: string) => {
    try {
      const updatedTask = await apiService.declineTask(taskId, reason);
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, status: updatedTask.status, declineReason: reason } : t
      ));
      
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: updatedTask.status, declineReason: reason });
      }
      
      setOpenDropdown(null);
    } catch (error) {
      console.error('Failed to decline task:', error);
    }
  };

  const toggleDropdown = (taskId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenDropdown(openDropdown === taskId ? null : taskId);
  };

  // Filter logic
  const mainFilters: MainFilter[] = ['priority', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const categoryFilters: (Category | 'all')[] = ['all', 'Cleaning', 'Cutting', 'Refilling', 'Other'];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
      const matchesSearch = task.task.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesMainFilter = false;
      if (activeMainFilter === 'priority') {
        matchesMainFilter = task.taskType === 'Priority';
      } else {
        matchesMainFilter = task.day === activeMainFilter;
      }

      return matchesCategory && matchesSearch && matchesMainFilter;
    });
  }, [tasks, activeMainFilter, selectedCategory, searchTerm]);

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <style>{`.sleek-scrollbar::-webkit-scrollbar { height: 4px; } .sleek-scrollbar::-webkit-scrollbar-track { background: transparent; } .sleek-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }`}</style>
      
      {/* Mobile Header */}
      <header className="lg:hidden bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-20">
        <button className="text-gray-600"><MenuIcon className="h-6 w-6" /></button>
        <h1 className="font-bold text-lg text-gray-800">Admin Dashboard</h1>
        <div className="w-6"></div>
      </header>

      {/* Main Content */}
      <main className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">Manage and oversee all restaurant tasks</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onLogout}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
              <button 
                onClick={() => setAddTaskModalOpen(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5"/>
                Add Task
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="mt-4 overflow-x-auto pb-2 sleek-scrollbar">
              <div className="flex space-x-2">
                {mainFilters.map(filter => (
                  <button 
                    key={filter} 
                    onClick={() => setActiveMainFilter(filter)} 
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors capitalize ${
                      activeMainFilter === filter ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {filter === 'priority' ? '🔥 Priority' : filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 overflow-x-auto pb-2 border-t border-gray-200 pt-3 sleek-scrollbar">
              <div className="flex space-x-2">
                {categoryFilters.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)} 
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === cat ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Task List / Table */}
          <div className="mt-6">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-5">Task</div>
              <div className="col-span-2">Assigned To</div>
              <div className="col-span-2">Day</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Task Items */}
            <div className="w-full space-y-4 lg:space-y-0">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onSelect={setSelectedTask}
                    onStatusChange={handleStatusChange}
                    onTaskApprove={handleTaskApprove}
                    onTaskDecline={handleTaskDecline}
                    openDropdown={openDropdown}
                    onToggleDropdown={toggleDropdown}
                  />
                ))
              ) : (
                <div className="text-center py-10 px-4 bg-white rounded-lg shadow-sm lg:col-span-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No tasks found</h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'Try adjusting your search or filter criteria to see more tasks.'
                      : 'Get started by creating your first task for the team.'
                    }
                  </p>
                  <button 
                    onClick={() => setAddTaskModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add First Task
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Floating Action Button (Mobile Only) */}
      <button 
        onClick={() => setAddTaskModalOpen(true)} 
        className="lg:hidden fixed bottom-6 right-6 h-12 w-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all z-30"
      >
        <PlusIcon className="h-5 w-5"/>
      </button>

      {/* Modals */}
      {isAddTaskModalOpen && (
        <AddTaskModal 
          isOpen={isAddTaskModalOpen} 
          onClose={() => setAddTaskModalOpen(false)} 
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
    </div>
  );
};

export default AdminTaskPanel;
