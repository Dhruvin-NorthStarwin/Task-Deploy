import React, { useState } from 'react';
import type { Task, Category, TaskType, Day } from '../../types';
import { CATEGORIES, DAYS } from '../../data/tasks';
import { CloseIcon } from '../common/Icons';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (tasks: Omit<Task, 'id' | 'status'>[]) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAddTask }) => {
  const [category, setCategory] = useState<Category>('Cleaning');
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [imageRequired, setImageRequired] = useState(false);
  const [videoRequired, setVideoRequired] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>('Daily');
  const [selectedDays, setSelectedDays] = useState<Day[]>([]);
  const [initials, setInitials] = useState('');

  if (!isOpen) return null;

  const handleDayToggle = (day: Day) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSelectAllDays = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDays(e.target.checked ? DAYS : []);
  };

  const handleSubmit = () => {
    if (!taskName || (taskType === 'Daily' && selectedDays.length === 0)) {
      alert("Please provide a task name and select at least one day for a Daily Task.");
      return;
    }
    const daysToCreate = taskType === 'Daily' ? selectedDays : [DAYS[(new Date().getDay() + 6) % 7]];
    const newTasks = daysToCreate.map(day => ({ 
      task: taskName, 
      description, 
      category, 
      imageRequired, 
      videoRequired,
      taskType, 
      day,
      initials: initials || undefined
    }));
    onAddTask(newTasks);
    onClose();
    // Reset form
    setTaskName('');
    setDescription('');
    setImageRequired(false);
    setVideoRequired(false);
    setTaskType('Daily');
    setSelectedDays([]);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Add New Task</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 overflow-y-auto flex-1">
          {/* Category and Task Name */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 block">Category</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value as Category)} 
                className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm sm:text-base"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 block">Task Name</label>
              <input 
                type="text" 
                placeholder="Enter task name" 
                value={taskName} 
                onChange={e => setTaskName(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base" 
              />
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Description (Optional)</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Add more details about the task..." 
              rows={3} 
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base resize-none" 
            />
          </div>
          
          {/* Initials */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Assign to (Optional)</label>
            <input
              type="text"
              placeholder="Enter initials (e.g. AB)"
              value={initials}
              onChange={e => setInitials(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              maxLength={5}
            />
          </div>
          
          {/* Requirements Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Image Required */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Image Required</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setImageRequired(true)} 
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                    imageRequired 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Yes
                </button>
                <button 
                  onClick={() => setImageRequired(false)} 
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                    !imageRequired 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
            
            {/* Video Required */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Video Required</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setVideoRequired(true)} 
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                    videoRequired 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Yes
                </button>
                <button 
                  onClick={() => setVideoRequired(false)} 
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                    !videoRequired 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>
          
          {/* Task Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">Task Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setTaskType('Daily')} 
                className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                  taskType === 'Daily' 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                📅 Daily Task
              </button>
              <button 
                onClick={() => setTaskType('Priority')} 
                className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                  taskType === 'Priority' 
                    ? 'bg-red-600 text-white border-red-600 shadow-md' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                🔥 Priority Task
              </button>
            </div>
          </div>
          
          {/* Day Selection for Daily Tasks */}
          {taskType === 'Daily' ? (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Select Days</label>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAllDays} 
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="ml-3 text-sm font-medium text-gray-700">
                    Select All Days
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedDays.includes(day)} 
                        onChange={() => handleDayToggle(day)} 
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                        id={`day-${day}`}
                      />
                      <label htmlFor={`day-${day}`} className="ml-3 text-sm text-gray-700 capitalize cursor-pointer">
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Priority Task</h4>
                    <p className="text-sm text-yellow-700">
                      Priority tasks are created for immediate completion and will appear in the Priority tab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer - Fixed */}
        <div className="flex flex-col sm:flex-row items-center justify-end p-4 sm:p-6 border-t border-gray-200 gap-3 flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
