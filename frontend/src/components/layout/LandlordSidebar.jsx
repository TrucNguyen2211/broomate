import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function LandlordSidebar({ isCollapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState('light');

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // TODO: Implement actual theme switching logic
    console.log('Theme switched to:', newTheme);
  };

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
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } h-full`}
    >
      {/* Collapse Toggle Button */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-lg font-bold text-gray-900">Landlord Menu</h2>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg 
            className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
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
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            {!isCollapsed && (
              <div className="flex flex-col items-start">
                <span className="font-medium">{item.label}</span>
                <span className={`text-xs ${isActive(item.path) ? 'text-pink-100' : 'text-gray-500'}`}>
                  {item.description}
                </span>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {/* Account */}
        <button
          onClick={() => navigate('/dashboard/landlord/account')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
            isActive('account')
              ? 'bg-teal-100 text-teal-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? 'Account' : ''}
        >
          <span className="text-xl">👤</span>
          {!isCollapsed && <span className="font-medium">Account</span>}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          title={isCollapsed ? 'Toggle theme' : ''}
        >
          <span className="text-xl">{theme === 'light' ? '🌙' : '☀️'}</span>
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
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
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