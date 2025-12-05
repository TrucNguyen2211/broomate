// FE/src/contexts/MessageContext.jsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import messageService from '../services/messageService';
import websocketService from '../services/websocketService';

const MessageContext = createContext();

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const [unreadConversationsCount, setUnreadConversationsCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  // ✅ Use ref to track which conversations are unread
  const conversationsWithUnreadRef = useRef(new Set());

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = user.userId;
  const token = localStorage.getItem('token');

  // ✅ Fetch initial unread conversations
  const fetchUnreadConversationsCount = async () => {
    if (!currentUserId) return;

    try {
      const data = await messageService.getAllConversations();
      
      // ✅ Get conversations with unreadCount > 0
      const unreadConvIds = (data.conversations || [])
        .filter(conv => (conv.unreadCount || 0) > 0)
        .map(conv => conv.id || conv.conversationId);
      
      conversationsWithUnreadRef.current = new Set(unreadConvIds);
      setUnreadConversationsCount(unreadConvIds.length);
      
      console.log('📊 Initial unread conversations:', unreadConvIds.length);
      console.log('📋 Unread conversation IDs:', unreadConvIds);
    } catch (error) {
      console.error('❌ Error fetching unread conversations:', error);
    }
  };

  // ✅ Connect to WebSocket
  useEffect(() => {
    if (!currentUserId || !token) return;

    fetchUnreadConversationsCount();

    let unsubscribeMessages = null;

    console.log('🔌 MessageContext: Connecting to WebSocket');

    websocketService.connect(token, currentUserId)
      .then(() => {
        console.log('✅ MessageContext: WebSocket connected');
        setIsConnected(true);

        // ✅ Listen for new messages
        unsubscribeMessages = websocketService.onNewMessage((payload) => {
          console.log('💬 MessageContext: New message in conversation:', payload.conversationId);
          
          // ✅ Only increment if this conversation is NOT already in unread set
          const wasAlreadyUnread = conversationsWithUnreadRef.current.has(payload.conversationId);
          
          if (!wasAlreadyUnread) {
            console.log('➕ Adding NEW unread conversation:', payload.conversationId);
            conversationsWithUnreadRef.current.add(payload.conversationId);
            setUnreadConversationsCount(prev => prev + 1);
            console.log('📊 New unread conversations count:', conversationsWithUnreadRef.current.size);
          } else {
            console.log('⏭️ Conversation already unread, not incrementing:', payload.conversationId);
          }
        });
      })
      .catch(error => {
        console.error('❌ MessageContext: Failed to connect WebSocket:', error);
        setIsConnected(false);
      });

    return () => {
      console.log('🧹 MessageContext: Cleaning up');
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [currentUserId, token]);

  // ✅ Mark conversation as read
  const markConversationAsRead = (conversationId) => {
    const wasUnread = conversationsWithUnreadRef.current.has(conversationId);
    
    if (wasUnread) {
      console.log('✅ Marking conversation as read:', conversationId);
      conversationsWithUnreadRef.current.delete(conversationId);
      setUnreadConversationsCount(prev => Math.max(0, prev - 1));
      console.log('📊 Remaining unread conversations:', conversationsWithUnreadRef.current.size);
    } else {
      console.log('⏭️ Conversation was not unread, no change:', conversationId);
    }
  };

  // ✅ Refresh count manually
  const refreshUnreadCount = () => {
    console.log('🔄 Refreshing unread conversations count...');
    fetchUnreadConversationsCount();
  };

  return (
    <MessageContext.Provider
      value={{
        unreadConversationsCount,
        isConnected,
        markConversationAsRead,
        refreshUnreadCount,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};