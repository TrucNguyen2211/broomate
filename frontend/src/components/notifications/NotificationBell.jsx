// FE/src/components/notifications/NotificationBell.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    handleNotificationClick,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);

      if (seconds < 60) return 'Just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
      
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const handleNotificationItemClick = (notification) => {
    handleNotificationClick(notification);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all p-2 rounded-lg"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{unreadCount} unread</p>
              )}
            </div>
            
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3">🔔</div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">No notifications yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationItemClick(notification)}
                    className={`w-full p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left relative group ${
                      !notification.read ? 'bg-teal-50 dark:bg-teal-900/20' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 text-2xl">
                      {notification.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${
                        !notification.read 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {notification.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      </div>
                    )}

                    {/* Delete Button (shows on hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Remove"
                    >
                      <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium py-2"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;