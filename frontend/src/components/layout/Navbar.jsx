import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, User, LogOut } from 'lucide-react'; // Import icons from lucide-react

function Navbar({ onOpenMessenger, unreadCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role; // 'TENANT' or 'LANDLORD'

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname.includes(path);

  // Dynamic routes based on role
  const dashboardRoute = userRole === 'TENANT' ? '/dashboard/tenant' : '/dashboard/landlord';
  const accountRoute = userRole === 'TENANT' ? '/dashboard/tenant/account' : '/dashboard/landlord/account';

  // **Tailwind class changes: Hide text on small screens (sm:) and below**
  
  // Helper function for common button styles
  const baseButtonClasses = "flex items-center justify-center transition-all sm:px-4 sm:py-2 rounded-lg font-medium";

  // Helper component for rendering navigation buttons
  const NavButton = ({ onClick, route, icon: Icon, label, activeClasses, defaultClasses }) => (
    <button
      onClick={onClick}
      className={`${baseButtonClasses} ${
        isActive(route.split('/').pop()) // Check activation by the last segment of the path, e.g., 'account'
          ? activeClasses
          : defaultClasses
      } p-2 sm:p-2`} // Reduce padding on mobile to save space
    >
      <Icon className="w-5 h-5" /> 
      {/* Text is set to be visible only from sm: upwards */}
      <span className="hidden sm:inline ml-1">{label}</span>
    </button>
  );

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
      
      {/* 1. Logo (Hide 'Broomate' text on mobile) */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(dashboardRoute)}>
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-400 to-teal-400 rounded-full flex items-center justify-center">
          <span className="text-lg sm:text-xl">🏠</span>
        </div>
        {/* Hide h1 text in mobile environments */}
        <h1 className="hidden sm:block text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-teal-500 bg-clip-text text-transparent">
          Broomate
        </h1>
      </div>

      {/* 2. Navigation Items (Show only icons on mobile) */}
      <div className="flex items-center gap-1 sm:gap-2">
        
        {/* Home */}
        <NavButton
          onClick={() => navigate(dashboardRoute)}
          route={dashboardRoute}
          icon={Home}
          label="Home"
          activeClasses={`bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md`}
          defaultClasses={`text-gray-600 hover:bg-gray-100`}
        />

        {/* Messages Pop-up Trigger */}
        <button
          onClick={onOpenMessenger}
          className="relative text-gray-600 hover:bg-gray-100 transition-all p-2 rounded-lg" // Mobile-friendly padding
          title="Messages"
        >
          <span className="flex items-center justify-center gap-1 sm:gap-2">
            <MessageSquare className="w-5 h-5" />
            {/* Text is set to be visible only from sm: upwards */}
            <span className="hidden sm:inline">Messages</span>
            
            {/* Unread Count Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:-right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
        </button>

        {/* Account */}
        <NavButton
          onClick={() => navigate(accountRoute)}
          route={accountRoute}
          icon={User}
          label="Account"
          activeClasses={`bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md`}
          defaultClasses={`text-gray-600 hover:bg-gray-100`}
        />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-red-600 hover:bg-red-50 transition-all p-2 rounded-lg ml-1 sm:ml-2 flex items-center justify-center" // Mobile-friendly padding and margin
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
          {/* Text is set to be visible only from sm: upwards */}
          <span className="hidden sm:inline ml-1">Logout</span>
        </button>
        
      </div>
    </nav>
  );
}

export default Navbar;