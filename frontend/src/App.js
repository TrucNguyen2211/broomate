// FE/src/App.js

import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { NotificationProvider } from './contexts/NotificationContext'; // ✅ ADD THIS
import { MessageProvider } from './contexts/MessageContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  // ✅ Request notification permission on app load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider> {/* ✅ ADD THIS WRAPPER */}
          <MessageProvider>
            <AppRoutes />
          </MessageProvider>
        </NotificationProvider> {/* ✅ ADD THIS CLOSING TAG */}
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;