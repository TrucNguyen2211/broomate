import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import TenantSidebar from './TenantSidebar.jsx';
import LandlordSidebar from './LandlordSidebar.jsx';
import MessengerPopup from './MessengerPopup.jsx';
import messageService from '../../services/messageService.js';

function DashboardLayout() {
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  // Determine user role from the route
  const isTenant = location.pathname.includes('/tenant');
  const isLandlord = location.pathname.includes('/landlord');

  // ✅ Fetch unread message count on mount and when messenger closes
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // ✅ Refresh unread count when messenger closes
  useEffect(() => {
    if (!isMessengerOpen) {
      fetchUnreadCount();
    }
  }, [isMessengerOpen]);

  const fetchUnreadCount = async () => {
    try {
      const data = await messageService.getAllConversations();
      const conversations = data.conversations || [];
      
      // ✅ Calculate total unread messages
      const totalUnread = conversations.reduce((sum, conv) => {
        return sum + (conv.unreadCount || 0);
      }, 0);
      
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-teal-50">
      {/* Navigation Bar */}
      <Navbar 
        onOpenMessenger={() => setIsMessengerOpen(true)} 
        unreadCount={unreadCount}  // ✅ Dynamic unread count
      />

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conditional Sidebar - Only show on tenant/landlord routes */}
        {(isTenant || isLandlord) && (
          <>
            {isTenant && (
              <TenantSidebar 
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />
            )}
            {isLandlord && (
              <LandlordSidebar 
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />
            )}
          </>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* Messenger Popup (Facebook-style) */}
      <MessengerPopup 
        isOpen={isMessengerOpen}
        onClose={() => setIsMessengerOpen(false)}
      />
    </div>
  );
}

export default DashboardLayout;