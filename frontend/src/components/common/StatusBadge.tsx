import React from 'react';
import type { Status } from '../../types';

interface StatusBadgeProps {
  status: Status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<Status, string> = {
    Unknown: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20',
    Submitted: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-700/10',
    Done: 'bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-400/20 opacity-60',
    Declined: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20',
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-md inline-flex items-center ${styles[status]} ${status === 'Done' ? 'line-through' : ''}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
