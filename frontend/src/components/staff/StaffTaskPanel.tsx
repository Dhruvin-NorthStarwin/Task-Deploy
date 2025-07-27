import React, { useState, useEffect, useMemo } from 'react';
import type { Task, Day, Category, Status } from '../../types';
import { CATEGORIES, DAYS } from '../../data/tasks';
import StatusBadge from '../common/StatusBadge';
import StaffTaskDetailModal from './StaffTaskDetailModal';
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
      <StaffTaskDetailModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
        onImageCapture={handleImageCapture} 
        onVideoCapture={handleVideoCapture}
        onTaskSubmit={handleTaskSubmit}
        onInitialsUpdate={handleInitialsUpdate}
      />
      <div className="bg-gray-50 min-h-screen font-sans">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Staff Tasks</h1>
            <div className="flex gap-4">
              <button 
                onClick={fetchTasks}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm hover:shadow-md"
              >
                Refresh
              </button>
              <button 
                onClick={onLogout} 
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-sm hover:shadow-md"
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
            <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-3 sleek-scrollbar">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter by Status:</span>
              <button 
                onClick={() => setStatusFilter('all')} 
                className={`${filterButtonBase} ${statusFilter === 'all' ? filterButtonActive : filterButtonInactive}`}
              >
                All Statuses
              </button>
              <button 
                onClick={() => setStatusFilter('Unknown')} 
                className={`${filterButtonBase} ${statusFilter === 'Unknown' ? filterButtonActive : filterButtonInactive}`}
              >
                Unknown
              </button>
              <button 
                onClick={() => setStatusFilter('Submitted')} 
                className={`${filterButtonBase} ${statusFilter === 'Submitted' ? filterButtonActive : filterButtonInactive}`}
              >
                Submitted
              </button>
              <button 
                onClick={() => setStatusFilter('Done')} 
                className={`${filterButtonBase} ${statusFilter === 'Done' ? filterButtonActive : filterButtonInactive}`}
              >
                Done
              </button>
              <button 
                onClick={() => setStatusFilter('Declined')} 
                className={`${filterButtonBase} ${statusFilter === 'Declined' ? filterButtonActive : filterButtonInactive}`}
              >
                Declined
              </button>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold">Task</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Initials</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Status</th>
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

export default StaffTaskPanel;
