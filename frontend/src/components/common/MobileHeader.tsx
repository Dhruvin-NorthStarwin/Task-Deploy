import React, { useState } from 'react';
import { MenuIcon, LogoutIcon, PlusIcon, RefreshIcon } from './MobileIcons';
import PWAInstallButton from './PWAInstallButton';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onLogout: () => void;
  onAddTask?: () => void;
  onRefresh?: () => void;
  showAddButton?: boolean;
  showRefreshButton?: boolean;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose, onLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={onClose}>
      <div className="bg-white w-64 h-full p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl">RestroManage</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <nav>
          <ul className="space-y-2">
            <li>
              <a href="#" className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                📊 Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                📋 Tasks
              </a>
            </li>
            <li>
              <a href="#" className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                👤 Profile
              </a>
            </li>
            <li>
              <PWAInstallButton />
            </li>
          </ul>
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors min-h-touch"
          >
            <LogoutIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  title, 
  subtitle, 
  onLogout, 
  onAddTask, 
  onRefresh,
  showAddButton = true,
  showRefreshButton = true
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-20 lg:hidden border-b border-gray-100">
        <button 
          onClick={() => setIsMenuOpen(true)} 
          className="text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-touch min-w-touch flex items-center justify-center"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        
        <div className="text-center flex-1 mx-3">
          <h1 className="font-bold mobile-title text-gray-800 truncate">{title}</h1>
          {subtitle && (
            <p className="mobile-caption text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {showRefreshButton && onRefresh && (
            <button 
              onClick={onRefresh}
              className="text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-touch min-w-touch flex items-center justify-center"
              title="Refresh"
            >
              <RefreshIcon className="h-5 w-5" />
            </button>
          )}
          {showAddButton && onAddTask && (
            <button 
              onClick={onAddTask}
              className="text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors min-h-touch min-w-touch flex items-center justify-center"
              title="Add Task"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Desktop Header */}
      <div className="hidden lg:flex justify-between items-center mb-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          <PWAInstallButton />
          {showRefreshButton && onRefresh && (
            <button 
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              <RefreshIcon className="h-5 w-5" />
              Refresh
            </button>
          )}
          {showAddButton && onAddTask && (
            <button 
              onClick={onAddTask}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add Task
            </button>
          )}
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:bg-red-600 transition-colors"
          >
            <LogoutIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onLogout={onLogout} 
      />
    </>
  );
};

export default MobileHeader;
