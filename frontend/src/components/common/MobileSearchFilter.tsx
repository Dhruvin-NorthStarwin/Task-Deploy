import React from 'react';
import type { Day, Category } from '../../types';
import { SearchIcon } from './MobileIcons';
import { DAYS, CATEGORIES } from '../../data/tasks';

interface MobileSearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeDay: Day | 'priority';
  onDayChange: (day: Day | 'priority') => void;
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

const MobileSearchFilter: React.FC<MobileSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  activeDay,
  onDayChange,
  activeCategory,
  onCategoryChange
}) => {
  const mainFilters = ['priority', ...DAYS] as (Day | 'priority')[];
  const categories = ['all', ...CATEGORIES] as (Category | 'all')[];

  return (
    <div className="bg-white p-4 rounded-mobile shadow-sm border border-gray-100 mb-4">
      {/* Enhanced Search Bar */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-mobile focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all mobile-base min-h-touch bg-gray-50 focus:bg-white"
        />
      </div>

      {/* Day & Priority Filters with Enhanced Mobile Design */}
      <div className="mb-4">
        <p className="mobile-sm font-semibold text-gray-700 mb-2">Day & Priority</p>
        <div className="overflow-x-auto pb-2 sleek-scrollbar">
          <div className="flex space-x-2 min-w-max">
            {mainFilters.map(filter => {
              const isActive = activeDay === filter;
              const isPriority = filter === 'priority';
              
              return (
                <button
                  key={filter}
                  onClick={() => onDayChange(filter)}
                  className={`px-4 py-2.5 mobile-sm font-semibold rounded-mobile whitespace-nowrap transition-all duration-200 min-w-fit border ${
                    isActive
                      ? isPriority 
                        ? 'bg-red-500 text-white shadow-md border-red-500'
                        : 'bg-indigo-500 text-white shadow-md border-indigo-500'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  {isPriority ? '🔥 Priority' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Filters with Enhanced Design */}
      <div>
        <p className="mobile-sm font-semibold text-gray-700 mb-2">Category</p>
        <div className="overflow-x-auto pb-2 border-t border-gray-100 pt-3 sleek-scrollbar">
          <div className="flex space-x-2 min-w-max">
            {categories.map(cat => {
              const isActive = activeCategory === cat;
              
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`px-4 py-2 mobile-sm font-semibold rounded-mobile whitespace-nowrap transition-all duration-200 min-w-fit border ${
                    isActive
                      ? 'bg-gray-800 text-white shadow-md border-gray-800'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSearchFilter;
