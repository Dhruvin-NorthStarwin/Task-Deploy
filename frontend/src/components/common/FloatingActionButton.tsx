import React from 'react';
import { PlusIcon } from './MobileIcons';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  icon = <PlusIcon className="h-6 w-6" />, 
  label,
  className = ''
}) => {
  return (
    <button 
      onClick={onClick}
      className={`lg:hidden fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all duration-200 z-50 min-h-touch min-w-touch transform hover:scale-105 active:scale-95 ${className}`}
      aria-label={label || 'Add'}
    >
      {icon}
    </button>
  );
};

export default FloatingActionButton;
