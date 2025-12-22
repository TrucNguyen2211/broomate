// FE/src/contexts/MessageContext.jsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [allConversations, setAllConversations] = useState([]);
  const [unreadConversationsCount, setUnreadConversationsCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const conversationsWithUnreadRef = useRef(new Set());

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = user.userId;
  const token = localStorage.getItem('token');

  // ✅ NEW: Load read conversations from localStorage
  const getReadConversations = () => {
    try {
      const stored = localStorage.getItem(`readConversations_${currentUserId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  };

  // ✅ NEW: Save read conversations to localStorage
  const saveReadConversations = (readSet) => {
    try {
      localStorage.setItem(
        `readConversations_${currentUserId}`,
        JSON.stringify([...readSet])
      );
    } catch (error) {
      console.error('Failed to save read conversations:', error);
    }
  };

  const fetchConversations = async () => {
    if (!currentUserId) return;

    try {
      console.log('📥 MessageContext: Fetching all conversations...');
      const data = await messageService.getAllConversations();
      
      setAllConversations(data.conversations || []);
      
      // ✅ LOAD READ CONVERSATIONS FROM LOCALSTORAGE
      const readConversations = getReadConversations();
      console.log('📖 Read conversations from localStorage:', readConversations.size);
      
      // ✅ Determine unread conversations
      const unreadConvIds = (data.conversations || [])
        .filter(conv => {
          const convId = conv.id || conv.conversationId;
          
          // Conversation is unread if:
          // 1. It has a last message
          // 2. It's NOT in the read conversations set
          const hasMessage = conv.lastMessage && conv.lastMessage.trim() !== '';
          const isRead = readConversations.has(convId);
          
          return hasMessage && !isRead;
        })
        .map(conv => conv.id || conv.conversationId);
      
      conversationsWithUnreadRef.current = new Set(unreadConvIds);
      setUnreadConversationsCount(unreadConvIds.length);
      
      console.log('📊 Total conversations:', data.conversations?.length || 0);
      console.log('📊 Unread conversations:', unreadConvIds.length);
      console.log('📋 Unread IDs:', [...unreadConvIds]);
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    if (!currentUserId || !token) return;

    fetchConversations();

    let unsubscribeMessages = null;
    let unsubscribeConversations = null;

    console.log('🔌 MessageContext: Connecting to WebSocket');

    websocketService.connect(token, currentUserId)
      .then(() => {
        console.log('✅ MessageContext: WebSocket connected');
        setIsConnected(true);

        unsubscribeMessages = websocketService.onNewMessage((payload) => {
          console.log('💬 MessageContext: New message in conversation:', payload.conversationId);
          
          if (payload.senderId === currentUserId) {
            console.log('⏭️ Ignoring own message for unread count');
            return;
          }
          
          const wasAlreadyUnread = conversationsWithUnreadRef.current.has(payload.conversationId);
          
          if (!wasAlreadyUnread) {
            console.log('➕ Adding NEW unread conversation:', payload.conversationId);
            conversationsWithUnreadRef.current.add(payload.conversationId);
            setUnreadConversationsCount(prev => prev + 1);
            
            // ✅ Remove from read set in localStorage
            const readConversations = getReadConversations();
            readConversations.delete(payload.conversationId);
            saveReadConversations(readConversations);
          }
          
          // ❌ REMOVED: Do NOT create notification for message
          // The red badge is enough!
          
          fetchConversations();
        });

        unsubscribeConversations = websocketService.onConversationNotification((payload) => {
          console.log('🎉 MessageContext: 3-way conversation created:', payload);
          
          // ❌ REMOVED: Do NOT show alert or notification
          // NotificationContext handles this now!
          
          fetchConversations();
        });
      })
      .catch(error => {
        console.error('❌ MessageContext: Failed to connect WebSocket:', error);
        setIsConnected(false);
      });

    return () => {
      console.log('🧹 MessageContext: Cleaning up');
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeConversations) unsubscribeConversations();
    };
  }, [currentUserId, token, navigate]);

  const markConversationAsRead = (conversationId) => {
    const wasUnread = conversationsWithUnreadRef.current.has(conversationId);
    
    if (wasUnread) {
      console.log('✅ Marking conversation as read:', conversationId);
      
      // ✅ Update in-memory state
      conversationsWithUnreadRef.current.delete(conversationId);
      setUnreadConversationsCount(prev => Math.max(0, prev - 1));
      
      // ✅ SAVE TO LOCALSTORAGE
      const readConversations = getReadConversations();
      readConversations.add(conversationId);
      saveReadConversations(readConversations);
      console.log('💾 Saved read status to localStorage');
      
      // ✅ Update conversation state
      setAllConversations(prev => 
        prev.map(conv => {
          const convId = conv.id || conv.conversationId;
          if (convId === conversationId) {
            console.log('🔄 Updating conversation unreadCount to 0 for:', convId);
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        })
      );
    } else {
      console.log('ℹ️ Conversation was NOT unread:', conversationId);
    }
  };

  return (
    <MessageContext.Provider
      value={{
        allConversations,
        unreadConversationsCount,
        unreadConversationIds: conversationsWithUnreadRef.current,
        isConnected,
        markConversationAsRead,
        fetchConversations,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};