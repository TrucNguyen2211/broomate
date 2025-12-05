// FE/src/components/navigation/MessengerPopup.jsx

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import ConversationList from '../messaging/ConversationList';
import ChatWindow from '../messaging/ChatWindow';
import messageService from '../../services/messageService';
import websocketService from '../../services/websocketService';
import { useMessages } from '../../contexts/MessageContext';

function MessengerPopup({ isOpen, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { markConversationAsRead } = useMessages();

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

    console.log('🔌 MessengerPopup: Connecting WebSocket');

    websocketService.connect(token, currentUserId)
      .then(() => {
        console.log('✅ WebSocket connected in MessengerPopup');

        unsubscribeMessages = websocketService.onNewMessage((payload) => {
          console.log('💬 Popup received new message:', payload);

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
                content: payload.content,
                mediaUrls: payload.mediaUrls || [],
                createdAt: payload.timestamp || new Date().toISOString(),
              }];
            });
          }

          // ✅ Update conversation list in real-time
          setConversations(prev => {
            const updated = prev.map(conv => {
              const convId = conv.id || conv.conversationId;
              if (convId === payload.conversationId) {
                return {
                  ...conv,
                  lastMessage: payload.content,
                  lastMessageAt: payload.timestamp,
                  unreadCount: convId === currentConvId 
                    ? 0 
                    : (conv.unreadCount || 0) + 1
                };
              }
              return conv;
            });

            return updated.sort((a, b) => {
              const timeA = new Date(a.lastMessageAt || 0);
              const timeB = new Date(b.lastMessageAt || 0);
              return timeB - timeA;
            });
          });
        });

        unsubscribeSwipes = websocketService.onNewSwipe((payload) => {
          console.log('👍 Popup received swipe notification:', payload);
          
          if (payload.isMatch) {
            alert(`🎉 It's a match with ${payload.swiperName}!`);
            fetchConversations();
          }
        });
      })
      .catch(error => {
        console.error('❌ Failed to connect WebSocket:', error);
      });

    return () => {
      console.log('🧹 MessengerPopup: Cleaning up WebSocket subscriptions');
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeSwipes) unsubscribeSwipes();
    };
  }, [isOpen, currentUserId]);

  // ✅ CRITICAL FIX: Fetch conversations EVERY TIME popup opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 MessengerPopup opened - fetching fresh conversations');
      fetchConversations();
    } else {
      // ✅ Reset state when popup closes
      console.log('🧹 MessengerPopup closed - resetting state');
      setSelectedConversation(null);
      setMessages([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    try {
      console.log('📥 MessengerPopup - Fetching conversations...');
      const data = await messageService.getAllConversations();
      console.log('💬 MessengerPopup - Fetched conversations:', data.conversations?.length);
      
      if (data.conversations?.length > 0) {
        console.log('🔍 First conversation structure:', data.conversations[0]);
        console.log('📊 Unread counts:', data.conversations.map(c => ({
          name: c.otherParticipantName,
          unreadCount: c.unreadCount
        })));
      }
      
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
    }
  };

  const handleSelectConversation = async (conversation) => {
    console.log('🎯 MessengerPopup - Selected conversation:', conversation);
    
    const convId = conversation?.conversationId || conversation?.id;
    const hasUnread = (conversation.unreadCount || 0) > 0;
    
    if (!convId) {
      console.error('❌ No conversation ID found:', conversation);
      alert('Cannot open conversation: Missing ID');
      setIsLoading(false);
      return;
    }

    setSelectedConversation(conversation);
    setIsLoading(true);

    try {
      console.log('📥 MessengerPopup - Fetching messages for:', convId);
      const data = await messageService.getMessages(convId);
      console.log('✅ MessengerPopup - Messages loaded:', data.messages?.length);
      setMessages(data.messages || []);
      
      try {
        await messageService.markAsRead(convId);
        
        // ✅ Mark conversation as read in global context
        if (hasUnread) {
          console.log('📉 Marking conversation as read:', convId);
          markConversationAsRead(convId);
        }
        
        // ✅ Update local state
        setConversations(prev => prev.map(conv => {
          const cId = conv.id || conv.conversationId;
          if (cId === convId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        }));
      } catch (readError) {
        console.warn('⚠️ Could not mark as read:', readError);
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
      
      setConversations(prev => prev.map(conv => {
        const cId = conv.id || conv.conversationId;
        if (cId === convId) {
          return {
            ...conv,
            lastMessage: content || '📎 Attachment',
            lastMessageAt: newMessage.createdAt
          };
        }
        return conv;
      }));
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

  const filteredConversations = conversations.filter(conv =>
    conv.otherParticipantName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />

      {/* Messenger Popup */}
      <div className="fixed bottom-0 right-6 w-96 h-[600px] bg-white rounded-t-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-lg">Messages</h3>
          <button 
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!selectedConversation ? (
            <ConversationList
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
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