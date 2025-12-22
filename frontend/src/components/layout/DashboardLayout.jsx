// FE/src/components/layout/DashboardLayout.jsx

import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar'; // ✅ FIXED PATH
import TenantSidebar from './TenantSidebar'; // ✅ FIXED PATH
import LandlordSidebar from './LandlordSidebar'; // ✅ FIXED PATH
import MessengerPopup from './MessengerPopup';
import { NotificationProvider } from '../../contexts/NotificationContext'; // ✅ NEW

function DashboardLayout() {
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const isTenant = location.pathname.includes('/tenant');
  const isLandlord = location.pathname.includes('/landlord');

  return (
    <NotificationProvider> {/* ✅ WRAP WITH PROVIDER */}
      <div className="h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar onOpenMessenger={() => setIsMessengerOpen(true)} />

        <div className="flex-1 flex overflow-hidden">
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

          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>

        <MessengerPopup 
          isOpen={isMessengerOpen}
          onClose={() => setIsMessengerOpen(false)}
        />
      </div>
    </NotificationProvider>
  );
}

export default DashboardLayout;