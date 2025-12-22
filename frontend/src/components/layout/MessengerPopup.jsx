// FE/src/components/navigation/MessengerPopup.jsx

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import ConversationList from '../messaging/ConversationList';
import ChatWindow from '../messaging/ChatWindow';
import messageService from '../../services/messageService';
import websocketService from '../../services/websocketService';
import { useMessages } from '../../contexts/MessageContext';

function MessengerPopup({ isOpen, onClose }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // ✅ GET FROM CONTEXT
  const { 
    allConversations,
    unreadConversationIds, 
    markConversationAsRead,
    fetchConversations 
  } = useMessages();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = user.userId;

  const selectedConversationRef = useRef(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // ✅ WebSocket connection
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    const token = localStorage.getItem('token');
    let unsubscribeMessages = null;
    let unsubscribeSwipes = null;
    let unsubscribeConversations = null;

    console.log('🔌 MessengerPopup: Connecting WebSocket');

    websocketService.connect(token, currentUserId)
      .then(() => {
        console.log('✅ WebSocket connected in MessengerPopup');

        unsubscribeMessages = websocketService.onNewMessage((payload) => {
          console.log('💬 Popup received new message:', payload);

          if (payload.senderId === currentUserId) {
            console.log('⏭️ Ignoring own message from WebSocket');
            return;
          }

          const currentConv = selectedConversationRef.current;
          const currentConvId = currentConv?.id || currentConv?.conversationId;

          if (payload.conversationId === currentConvId) {
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === payload.messageId);
              if (exists) {
                console.log('⚠️ Message already exists, skipping duplicate');
                return prev;
              }

              return [...prev, {
                id: payload.messageId,
                conversationId: payload.conversationId,
                senderId: payload.senderId,
                senderName: payload.senderName,
                senderAvatar: payload.senderAvatar,
                content: payload.content,
                mediaUrls: payload.mediaUrls || [],
                createdAt: payload.timestamp || new Date().toISOString(),
              }];
            });
          }
        });

        unsubscribeSwipes = websocketService.onNewSwipe((payload) => {
          console.log('👍 Popup received swipe notification:', payload);
          
          if (payload.isMatch) {
            alert(`🎉 It's a match with ${payload.swiperName}!`);
          }
        });

        unsubscribeConversations = websocketService.onConversationNotification((payload) => {
          console.log('👥 Popup received 3-way conversation notification:', payload);
          
          const participantNames = payload.participants
            .filter(p => p.userId !== currentUserId)
            .map(p => p.name)
            .join(' and ');
          
          alert(`👥 Group chat created for "${payload.roomTitle}" with ${participantNames}!`);
        });
      })
      .catch(error => {
        console.error('❌ Failed to connect WebSocket:', error);
      });

    return () => {
      console.log('🧹 MessengerPopup: Cleaning up WebSocket subscriptions');
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeSwipes) unsubscribeSwipes();
      if (unsubscribeConversations) unsubscribeConversations();
    };
  }, [isOpen, currentUserId]);

  // ✅ Refresh when popup opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 MessengerPopup opened - refreshing conversations');
      fetchConversations();
    } else {
      console.log('🧹 MessengerPopup closed - resetting state');
      setSelectedConversation(null);
      setMessages([]);
      setSearchQuery('');
    }
  }, [isOpen, fetchConversations]);

  // ✅ CRITICAL: Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    console.log('🎯 MessengerPopup - Selected conversation:', conversation);
    
    const convId = conversation?.conversationId || conversation?.id;
    
    console.log('🔍 Conversation ID:', convId);
    console.log('🔍 markConversationAsRead function exists?', typeof markConversationAsRead);
    
    if (!convId) {
      console.error('❌ No conversation ID found:', conversation);
      alert('Cannot open conversation: Missing ID');
      return;
    }

    setSelectedConversation(conversation);
    setIsLoading(true);

    try {
      console.log('📥 MessengerPopup - Fetching messages for:', convId);
      const data = await messageService.getMessages(convId);
      console.log('✅ MessengerPopup - Messages loaded:', data.messages?.length);
      setMessages(data.messages || []);
      
      // ✅ CRITICAL: Mark as read
      console.log('📖 About to call markConversationAsRead()');
      
      if (typeof markConversationAsRead === 'function') {
        markConversationAsRead(convId);
        console.log('✅ Called markConversationAsRead()');
      } else {
        console.error('❌ markConversationAsRead is not a function!', markConversationAsRead);
      }
      
    } catch (error) {
      console.error('❌ MessengerPopup - Error fetching messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content, file = null) => {
    if (!selectedConversation) {
      console.error('❌ No conversation selected');
      return;
    }

    const convId = selectedConversation?.conversationId || selectedConversation?.id;
    
    if (!convId) {
      console.error('❌ No conversation ID found');
      alert('Cannot send message: Invalid conversation');
      return;
    }

    console.log('📤 Sending message:', { 
      conversationId: convId, 
      hasContent: !!content, 
      hasFile: !!file,
      fileName: file?.name 
    });
    
    setIsSending(true);

    try {
      const newMessage = await messageService.sendMessage(convId, content, file);
      
      console.log('✅ Message sent successfully:', newMessage);
      setMessages(prev => [...prev, newMessage]);
      
      fetchConversations();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  // ✅ Filter conversations
  const filteredConversations = allConversations.filter(conv => {
    if (conv.conversationType === 'THREE_WAY') {
      const participantNames = conv.allParticipants
        ?.map(p => p.name)
        .join(' ')
        .toLowerCase() || '';
      return participantNames.includes(searchQuery.toLowerCase());
    } else {
      return conv.otherParticipantName?.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />

      <div className="fixed bottom-0 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-lg">Messages</h3>
          <button 
            onClick={onClose}
            className="hover:bg-white/20 dark:hover:bg-white/30 p-1 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {!selectedConversation ? (
            <ConversationList
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              currentUserId={currentUserId}
              unreadConversationIds={unreadConversationIds}
              compact={true}
            />
          ) : (
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              currentUserId={currentUserId}
              onSendMessage={handleSendMessage}
              onBack={handleBack}
              isSending={isSending}
              isLoading={isLoading}
              compact={true}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default MessengerPopup;