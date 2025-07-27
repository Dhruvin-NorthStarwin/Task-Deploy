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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Add New Task</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <CloseIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto sleek-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value as Category)} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Task Name" 
              value={taskName} 
              onChange={e => setTaskName(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description (Optional)</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Add more details about the task..." 
              rows={3} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Initials (Optional)</label>
            <input
              type="text"
              placeholder="Enter initials (e.g. AB)"
              value={initials}
              onChange={e => setInitials(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={5}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Image Required</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setImageRequired(true)} 
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${imageRequired ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                Yes
              </button>
              <button 
                onClick={() => setImageRequired(false)} 
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${!imageRequired ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                No
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Video Required</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setVideoRequired(true)} 
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${videoRequired ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                Yes
              </button>
              <button 
                onClick={() => setVideoRequired(false)} 
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${!videoRequired ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                No
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Task Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setTaskType('Daily')} 
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${taskType === 'Daily' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                Daily Task
              </button>
              <button 
                onClick={() => setTaskType('Priority')} 
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${taskType === 'Priority' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                Priority Task
              </button>
            </div>
          </div>
          {taskType === 'Daily' ? (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Week Days</label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAllDays} 
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                  />
                  <label className="ml-3 text-sm text-gray-600">Everyday (Select All)</label>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedDays.includes(day)} 
                        onChange={() => handleDayToggle(day)} 
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                      <label className="ml-3 text-sm text-gray-600 capitalize">{day}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Task Duration</label>
              <div className="grid grid-cols-2 gap-2">
                <button className="px-4 py-2.5 rounded-lg text-sm font-semibold border bg-indigo-600 text-white border-indigo-600">
                  1 Day
                </button>
                <button className="px-4 py-2.5 rounded-lg text-sm font-semibold border bg-white text-gray-700 border-gray-300">
                  2 Days
                </button>
              </div>
              <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 p-3 rounded-lg flex items-center gap-2">
                <span>💡</span>
                Multiple instances will be created based on selected duration (1-2 days).
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end p-6 border-t border-gray-200 gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
