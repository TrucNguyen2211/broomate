// FE/src/components/navigation/LandlordSidebar.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext'; // ✅ ADD THIS

function LandlordSidebar({ isCollapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme(); // ✅ ADD THIS

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      icon: '🏠',
      label: 'Dashboard',
      path: '/dashboard/landlord',
      description: 'Home'
    },
    {
      icon: '➕',
      label: 'Upload Room',
      path: '/dashboard/landlord/upload-room',
      description: 'Add new listing'
    },
    {
      icon: '🏘️',
      label: 'My Rooms',
      path: '/dashboard/landlord/my-rooms',
      description: 'Manage listings'
    },
    {
      icon: '🔍',
      label: 'Browse Rooms',
      path: '/dashboard/landlord/browse-rooms',
      description: 'Other landlords'
    }
  ];

  return (
    <div 
      className={`border-r flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } h-full
      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700`} // ✅ UPDATED
    >
      {/* Collapse Toggle Button */}
      <div className="p-4 border-b flex items-center justify-between border-gray-200 dark:border-gray-700"> {/* ✅ UPDATED */}
        {!isCollapsed && (
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Landlord Menu</h2>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg transition hover:bg-gray-100 dark:hover:bg-gray-800" // ✅ UPDATED
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg 
            className={`w-5 h-5 transition-transform text-gray-600 dark:text-gray-300 ${isCollapsed ? 'rotate-180' : ''}`} // ✅ UPDATED
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Main Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' // ✅ UPDATED
            }`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            {!isCollapsed && (
              <div className="flex flex-col items-start">
                <span className="font-medium">{item.label}</span>
                <span className={`text-xs ${isActive(item.path) ? 'text-pink-100' : 'text-gray-500 dark:text-gray-400'}`}> {/* ✅ UPDATED */}
                  {item.description}
                </span>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t space-y-2 border-gray-200 dark:border-gray-700"> {/* ✅ UPDATED */}
        {/* Account */}
        <button
          onClick={() => navigate('/dashboard/landlord/account')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
            isActive('/dashboard/landlord/account')
              ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300' // ✅ UPDATED
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' // ✅ UPDATED
          }`}
          title={isCollapsed ? 'Account' : ''}
        >
          <span className="text-xl">👤</span>
          {!isCollapsed && <span className="font-medium">Account</span>}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme} // ✅ UPDATED
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" // ✅ UPDATED
          title={isCollapsed ? 'Toggle theme' : ''}
        >
          <span className="text-xl">{isDark ? '☀️' : '🌙'}</span> {/* ✅ UPDATED */}
          {!isCollapsed && <span className="font-medium">Theme: {theme}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to logout?')) {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              navigate('/login');
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" // ✅ UPDATED
          title={isCollapsed ? 'Logout' : ''}
        >
          <span className="text-xl">🚪</span>
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default LandlordSidebar;