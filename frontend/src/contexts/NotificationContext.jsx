// FE/src/contexts/NotificationContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import websocketService from '../services/websocketService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = user.userId;
  const token = localStorage.getItem('token');

  // ✅ Add a notification
  const addNotification = useCallback((notification) => {
    console.log('➕ Adding notification:', notification);
    
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  // ✅ Mark single notification as read
  const markAsRead = useCallback((notificationId) => {
    console.log('📖 Marking notification as read:', notificationId);
    
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // ✅ Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    console.log('📖 Marking all notifications as read');
    
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    
    setUnreadCount(0);
  }, []);

  // ✅ Clear a notification
  const clearNotification = useCallback((notificationId) => {
    console.log('🗑️ Clearing notification:', notificationId);
    
    setNotifications(prev => {
      const notif = prev.find(n => n.id === notificationId);
      const wasUnread = notif && !notif.read;
      
      if (wasUnread) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // ✅ Handle notification click (navigate to relevant page)
    const handleNotificationClick = useCallback((notification) => {
        console.log('🖱️ Notification clicked:', notification);
        
        markAsRead(notification.id);
        
        switch (notification.type) {
            case 'swipe':
            // Navigate to Find Roommates page and show the swiper's profile
            console.log('🔄 Navigating to Find Roommates with swiper:', notification.data.swiperId);
            navigate('/dashboard/tenant/find-roommates', {
                state: { 
                viewSwiperId: notification.data.swiperId,
                swiperName: notification.data.swiperName,
                swiperAvatar: notification.data.swiperAvatar
                }
            });
            break;
            
            case 'match':
            case 'group-match':
            // Navigate to Messages page and open conversation
            navigate('/dashboard/messages', {
                state: { conversationId: notification.data.conversationId }
            });
            break;
            
            default:
            console.warn('Unknown notification type:', notification.type);
            break;
        }
    }, [navigate, markAsRead]);

  // ✅ WebSocket connection and subscriptions
  useEffect(() => {
    if (!currentUserId || !token) {
      console.log('⚠️ NotificationContext: No user or token, skipping WebSocket');
      return;
    }

    console.log('🔔 NotificationContext: Initializing...');

    let unsubscribeSwipes = null;
    let unsubscribeConversations = null;

    websocketService.connect(token, currentUserId)
      .then(() => {
        console.log('✅ NotificationContext: WebSocket connected');

        // ✅ 1. SWIPE NOTIFICATIONS (interests and matches)
        unsubscribeSwipes = websocketService.onNewSwipe((payload) => {
        console.log('🎯 NOTIFICATION CONTEXT: Swipe callback triggered!');
        console.log('📦 Received payload:', payload);
        console.log('📊 Payload details:', {
            swipeId: payload.swipeId,
            swiperId: payload.swiperId,
            swiperName: payload.swiperName,
            isMatch: payload.isMatch,
            conversationId: payload.conversationId
        });
        
        if (!payload) {
            console.error('❌ Payload is null/undefined!');
            return;
        }
        
        if (!payload.isMatch) {
            console.log('👋 Processing interest notification...');
            
            const notification = {
            id: `swipe-${payload.swipeId || Date.now()}`,
            type: 'swipe',
            title: `${payload.swiperName} is interested!`,
            description: 'Check out their profile and swipe right to connect',
            icon: '👋',
            timestamp: payload.timestamp || new Date().toISOString(),
            read: false,
            data: {
                swiperId: payload.swiperId,
                swiperName: payload.swiperName,
                swiperAvatar: payload.swiperAvatar,
            }
            };
            
            console.log('➕ Adding interest notification:', notification);
            addNotification(notification);
            console.log('✅ Interest notification added!');
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
            console.log('🔔 Showing browser notification');
            new Notification('New Interest! 👋', {
                body: `${payload.swiperName} wants to connect with you!`,
                icon: payload.swiperAvatar || '/logo192.png'
            });
            } else {
            console.log('⚠️ Browser notifications not available or not permitted');
            }
        } else {
            console.log('🎉 Processing match notification...');
            
            const notification = {
            id: `match-${payload.conversationId || Date.now()}`,
            type: 'match',
            title: `It's a Match! 🎉`,
            description: `You and ${payload.swiperName} both swiped right!`,
            icon: '🎉',
            timestamp: payload.timestamp || new Date().toISOString(),
            read: false,
            data: {
                conversationId: payload.conversationId,
                matchedUserId: payload.swiperId,
                matchedUserName: payload.swiperName,
                matchedUserAvatar: payload.swiperAvatar,
            }
            };
            
            console.log('➕ Adding match notification:', notification);
            addNotification(notification);
            console.log('✅ Match notification added!');
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
            console.log('🔔 Showing browser notification');
            new Notification(`It's a Match! 🎉`, {
                body: `You and ${payload.swiperName} can now chat!`,
                icon: payload.swiperAvatar || '/logo192.png'
            });
            } else {
            console.log('⚠️ Browser notifications not available or not permitted');
            }
        }
        
        console.log('🏁 Swipe callback finished processing');
        });

        console.log('✅ Swipe callback registered in NotificationContext');

        // ✅ 2. CONVERSATION NOTIFICATIONS (3-way group chats)
        unsubscribeConversations = websocketService.onConversationNotification((payload) => {
          console.log('👥 Conversation notification received:', payload);
          
          if (payload.type === 'THREE_WAY_CONVERSATION_CREATED') {
            const participantNames = payload.participants
              .filter(p => p.userId !== currentUserId)
              .map(p => p.name)
              .join(' and ');
            
            addNotification({
              id: `conv-${payload.conversationId || Date.now()}`,
              type: 'group-match',
              title: 'Group Chat Created! 👥',
              description: `You, ${participantNames} matched for "${payload.roomTitle}"`,
              icon: '👥',
              timestamp: payload.timestamp || new Date().toISOString(),
              read: false,
              data: {
                conversationId: payload.conversationId,
                roomTitle: payload.roomTitle,
                roomImageUrl: payload.roomImageUrl,
                participants: payload.participants,
              }
            });
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Perfect Match! 👥', {
                body: `Group chat created for "${payload.roomTitle}"`,
                icon: payload.roomImageUrl || '/logo192.png'
              });
            }
          }
        });

        // ✅ 3. DO NOT SUBSCRIBE TO MESSAGES
        // Messages are handled by MessageContext for the red badge only
        
      })
      .catch(error => {
        console.error('❌ NotificationContext: Failed to connect WebSocket:', error);
      });

    return () => {
      console.log('🧹 NotificationContext: Cleaning up');
      if (unsubscribeSwipes) unsubscribeSwipes();
      if (unsubscribeConversations) unsubscribeConversations();
    };
  }, [currentUserId, token, addNotification]);

  // ✅ Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        handleNotificationClick,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};