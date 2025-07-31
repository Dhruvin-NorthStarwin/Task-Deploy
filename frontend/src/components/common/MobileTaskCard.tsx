import React from 'react';
import type { Task } from '../../types';
import StatusBadge from './StatusBadge';
import { MoreVerticalIcon } from './MobileIcons';

interface MobileTaskCardProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  onActionClick: (taskId: number, event: React.MouseEvent) => void;
  showActions?: boolean;
}

const MobileTaskCard: React.FC<MobileTaskCardProps> = ({ 
  task, 
  onTaskClick, 
  onActionClick, 
  showActions = true 
}) => {
  return (
    <div 
      className="bg-white p-4 rounded-mobile shadow-sm border border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-98"
      onClick={() => onTaskClick(task)}
    >
      {/* Task Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Priority/Status Indicator */}
          <span 
            className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
              task.status === 'Done' ? 'bg-green-500' :
              task.status === 'Declined' ? 'bg-red-500' :
              task.status === 'Submitted' ? 'bg-blue-500' :
              task.taskType === 'Priority' ? 'bg-orange-500' :
              'bg-gray-400'
            }`}
          />
          {/* Task Name */}
          <p className={`mobile-title font-semibold text-gray-800 line-clamp-2 ${
            task.status === 'Done' ? 'line-through text-gray-500' : ''
          }`}>
            {task.task}
          </p>
        </div>
        
        {/* Action Button */}
        {showActions && task.status !== 'Done' && (
          <button 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors min-h-touch min-w-touch flex items-center justify-center ml-2"
            onClick={(e) => {
              e.stopPropagation();
              onActionClick(task.id, e);
            }}
          >
            <MoreVerticalIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Task Details */}
      <div className="flex items-center justify-between">
        {/* Assigned User */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs">
            {task.initials ? task.initials.toUpperCase() : '?'}
          </div>
          <div className="flex flex-col">
            <span className="mobile-sm text-gray-600">
              {task.initials || 'Unassigned'}
            </span>
            <span className="mobile-xs text-gray-400 capitalize">
              {task.category}
            </span>
          </div>
        </div>
        
        {/* Status Badge */}
        <StatusBadge status={task.status} />
      </div>

      {/* Additional Info for Priority Tasks */}
      {task.taskType === 'Priority' && (
        <div className="mt-2 flex items-center gap-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            🔥 High Priority
          </span>
        </div>
      )}
    </div>
  );
};

export default MobileTaskCard;
