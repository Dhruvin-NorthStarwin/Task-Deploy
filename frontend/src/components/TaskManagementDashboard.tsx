import React, { useState, useMemo } from 'react';

// --- TYPE DEFINITIONS ---
type TaskStatus = 'Done' | 'Declined' | 'Unknown' | 'In Progress';
type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
type Category = 'Cleaning' | 'Cutting' | 'Refilling' | 'Other';

interface Task {
  id: number;
  name: string;
  assignedTo: string;
  day: Day;
  category: Category;
  status: TaskStatus;
}

// --- MOCK DATA ---
// In a real application, this data would come from an API
const initialTasks: Task[] = [
  { id: 1, name: 'Clean grease trap', assignedTo: 'pp', day: 'Monday', category: 'Cleaning', status: 'Declined' },
  { id: 2, name: 'Restock napkins', assignedTo: 'ad', day: 'Tuesday', category: 'Refilling', status: 'Done' },
  { id: 3, name: 'Chop onions for prep', assignedTo: 'ad', day: 'Monday', category: 'Cutting', status: 'Done' },
  { id: 4, name: 'Wipe down all tables', assignedTo: 'jp', day: 'Wednesday', category: 'Cleaning', status: 'Unknown' },
  { id: 5, name: 'Filter fryer oil', assignedTo: 'pp', day: 'Thursday', category: 'Cleaning', status: 'In Progress' },
  { id: 6, name: 'Organize walk-in cooler', assignedTo: 'ad', day: 'Friday', category: 'Other', status: 'Done' },
  { id: 7, name: 'Cut lemons and limes', assignedTo: 'jp', day: 'Saturday', category: 'Cutting', status: 'Unknown' },
  { id: 8, name: 'Refill salt and pepper shakers', assignedTo: 'pp', day: 'Sunday', category: 'Refilling', status: 'Declined' },
];

// --- HELPER COMPONENTS & ICONS ---

// Using inline SVGs for icons to keep it self-contained
const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const MoreVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
  </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);


// --- UI COMPONENTS ---

const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full';
  const statusClasses = {
    Done: 'bg-green-100 text-green-800',
    Declined: 'bg-red-100 text-red-800',
    Unknown: 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const TaskCard = ({ task }: { task: Task }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${task.status === 'Declined' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
            <p className="font-semibold text-gray-800">{task.name}</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVerticalIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs">
            {task.assignedTo.toUpperCase()}
          </div>
          <span>{task.assignedTo}</span>
        </div>
        <StatusBadge status={task.status} />
      </div>
    </div>
  );
};

const TaskManagementDashboard = () => {
  const [tasks] = useState<Task[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState<Day | 'All'>('Monday');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const days: (Day | 'All')[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const categories: (Category | 'All')[] = ['All', 'Cleaning', 'Cutting', 'Refilling', 'Other'];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesDay = selectedDay === 'All' || task.day === selectedDay;
      const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDay && matchesCategory && matchesSearch;
    });
  }, [tasks, selectedDay, selectedCategory, searchTerm]);

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Custom scrollbar styles are injected here */}
      <style>{`
        /* Custom Scrollbar Styles for Webkit browsers (Chrome, Safari) */
        .sleek-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .sleek-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sleek-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e2e8f0; /* slate-200 */
          border-radius: 10px;
        }
        .sleek-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #cbd5e1; /* slate-300 */
        }
        /* Custom Scrollbar Styles for Firefox */
        .sleek-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }
      `}</style>
      <div className="relative">
        {/* Header */}
        <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-20 lg:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600">
            <MenuIcon />
          </button>
          <h1 className="font-bold text-lg text-gray-800">Admin Dashboard</h1>
          <div className="w-8"></div> {/* Spacer */}
        </header>

        {/* Mobile Menu (Sidebar) */}
        {isMenuOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsMenuOpen(false)}>
                <div className="bg-white w-64 h-full p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h2 className="font-bold text-xl mb-6">Menu</h2>
                    <nav>
                        <ul>
                            <li>
                                <a href="#" className="block py-2 px-3 rounded hover:bg-gray-100">Dashboard</a>
                            </li>
                            <li>
                                <a href="#" className="block py-2 px-3 rounded hover:bg-gray-100">Profile</a>
                            </li>
                            <li>
                                <button className="w-full text-left mt-4 py-2 px-3 rounded bg-red-500 text-white font-semibold hover:bg-red-600">
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        )}

        {/* Main Content */}
        <main className="p-4 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Desktop Header */}
                <div className="hidden lg:flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-1">Manage and oversee all restaurant tasks</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:bg-red-600 transition-colors">
                            Logout
                        </button>
                         <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                            <PlusIcon className="h-5 w-5"/>
                            Add Task
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Day Filters */}
                    <div className="mt-4 overflow-x-auto pb-2 sleek-scrollbar">
                        <div className="flex space-x-2">
                            {days.map(day => (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                                        selectedDay === day
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="mt-3 overflow-x-auto pb-2 border-t border-gray-200 pt-3 sleek-scrollbar">
                        <div className="flex space-x-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                                        selectedCategory === cat
                                            ? 'bg-gray-800 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="mt-6 space-y-4">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map(task => <TaskCard key={task.id} task={task} />)
                    ) : (
                        <div className="text-center py-10 px-4 bg-white rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-700">No tasks found</h3>
                            <p className="text-gray-500 mt-1">Try adjusting your filters or search term.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
        
        {/* Floating Action Button (Mobile) */}
        <button className="lg:hidden fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all">
           <PlusIcon className="h-7 w-7"/>
        </button>
      </div>
    </div>
  );
};

export default TaskManagementDashboard;
