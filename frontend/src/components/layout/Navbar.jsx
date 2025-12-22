// FE/src/components/navigation/Navbar.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, User, LogOut } from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell'; // ✅ NEW IMPORT
import { useMessages } from '../../contexts/MessageContext';

function Navbar({ onOpenMessenger }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadConversationsCount } = useMessages();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname.includes(path);

  const dashboardRoute = userRole === 'TENANT' ? '/dashboard/tenant' : '/dashboard/landlord';
  const accountRoute = userRole === 'TENANT' ? '/dashboard/tenant/account' : '/dashboard/landlord/account';

  const baseButtonClasses = "flex items-center justify-center transition-all sm:px-4 sm:py-2 rounded-lg font-medium";

  const NavButton = ({ onClick, route, icon: Icon, label, activeClasses, defaultClasses }) => (
    <button
      onClick={onClick}
      className={`${baseButtonClasses} ${
        isActive(route.split('/').pop())
          ? activeClasses
          : defaultClasses
      } p-2 sm:p-2`}
    >
      <Icon className="w-5 h-5" /> 
      <span className="hidden sm:inline ml-1">{label}</span>
    </button>
  );

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
      
      {/* Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(dashboardRoute)}>
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-400 to-teal-400 rounded-full flex items-center justify-center">
          <span className="text-lg sm:text-xl">🏠</span>
        </div>
        <h1 className="hidden sm:block text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-teal-500 bg-clip-text text-transparent">
          Broomate
        </h1>
      </div>

      {/* Navigation Items */}
      <div className="flex items-center gap-1 sm:gap-2">
        
        {/* Home */}
        <NavButton
          onClick={() => navigate(dashboardRoute)}
          route={dashboardRoute}
          icon={Home}
          label="Home"
          activeClasses="bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md"
          defaultClasses="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        />

        {/* Messages */}
        <button
          onClick={onOpenMessenger}
          className="relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all p-2 rounded-lg"
          title="Messages"
        >
          <span className="flex items-center justify-center gap-1 sm:gap-2">
            <MessageSquare className="w-5 h-5" />
            <span className="hidden sm:inline">Messages</span>
            
            {unreadConversationsCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:-right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadConversationsCount > 99 ? '99+' : unreadConversationsCount}
              </span>
            )}
          </span>
        </button>

        {/* ✅ NEW: Notification Bell */}
        <NotificationBell />

        {/* Account */}
        <NavButton
          onClick={() => navigate(accountRoute)}
          route={accountRoute}
          icon={User}
          label="Account"
          activeClasses="bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md"
          defaultClasses="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all p-2 rounded-lg ml-1 sm:ml-2 flex items-center justify-center"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline ml-1">Logout</span>
        </button>
        
      </div>
    </nav>
  );
}

export default Navbar;