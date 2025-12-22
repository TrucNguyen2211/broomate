// FE/src/pages/shared/MessagesPage.jsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import ConversationList from '../../components/messaging/ConversationList';
import ChatWindow from '../../components/messaging/ChatWindow';
import messageService from '../../services/messageService';
import websocketService from '../../services/websocketService';
import { useMessages } from '../../contexts/MessageContext';

function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const { markConversationAsRead, unreadConversationIds } = useMessages();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = user.userId;

  const selectedConversationRef = useRef(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // ✅ Connect to WebSocket on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    let unsubscribeMessages = null;
    let unsubscribeSwipes = null;
    
    if (token && currentUserId) {
      console.log('🔌 Connecting WebSocket for user:', currentUserId);
      
      websocketService.connect(token, currentUserId)
        .then(() => {
          console.log('✅ WebSocket connected in MessagesPage');
          
          unsubscribeMessages = websocketService.onNewMessage((payload) => {
            console.log('💬 📥 Message received in MessagesPage:', payload);
            
            // ✅ FIX: Don't add your own messages (already added locally)
            if (payload.senderId === currentUserId) {
              console.log('⏭️ Ignoring own message from WebSocket (already added locally)');
              return;
            }
            
            const currentConv = selectedConversationRef.current;
            const currentConvId = currentConv?.id || currentConv?.conversationId;
            
            console.log('🔍 Current conversation ID:', currentConvId);
            console.log('📨 Incoming message conversation ID:', payload.conversationId);
            
            if (payload.conversationId === currentConvId) {
              console.log('✅ Adding message to current chat window');
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
            } else {
              console.log('⏭️ Message is for different conversation, updating sidebar only');
            }
            
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
            console.log('👍 📥 Swipe received in MessagesPage:', payload);
            
            if (payload.isMatch) {
              alert(`🎉 It's a match with ${payload.swiperName}!`);
              fetchConversations();
            }
          });
        })
        .catch(error => {
          console.error('❌ Failed to connect WebSocket:', error);
        });
    }
    
    return () => {
      console.log('🧹 Cleaning up WebSocket subscriptions');
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeSwipes) unsubscribeSwipes();
    };
  }, [currentUserId]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (location.state?.conversationId && conversations.length > 0) {
      const convId = location.state.conversationId;
      const conv = conversations.find(c => 
        c.conversationId === convId || c.id === convId
      );
      
      if (conv) {
        console.log('✅ Found conversation:', conv);
        handleSelectConversation(conv);
      } else {
        console.log('❌ Conversation not found in list!');
      }
    }
  }, [location.state, conversations]);

  const fetchConversations = async () => {
    try {
      const data = await messageService.getAllConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    const convId = conversation?.conversationId || conversation?.id;
    
    if (!convId) {
      console.error('❌ ERROR: No conversationId found');
      alert('Cannot load conversation: Missing conversation ID');
      return;
    }

    setSelectedConversation(conversation);

    try {
      const data = await messageService.getConversationDetail(convId);
      
      console.log('=== CONVERSATION DETAIL ===');
      console.log('Conversation Type:', data.conversationType);
      console.log('All Participants:', data.allParticipants);
      console.log('Messages:', data.messages);
      
      setSelectedConversation({
        ...conversation,
        ...data,
      });
      
      setMessages(data.messages || []);
      
      // ✅ ALWAYS mark as read (remove the if condition)
      console.log('📖 MessagesPage - Marking conversation as read:', convId);
      markConversationAsRead(convId);
      console.log('✅ Marked conversation as read');
      
      // Update local conversation list
      setConversations(prev => prev.map(conv => {
        const cId = conv.id || conv.conversationId;
        if (cId === convId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      }));
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setMessages([]);
      alert('Failed to load messages. Please try again.');
    }
  };

  const handleSendMessage = async (content, file = null) => {
    if (!selectedConversation) {
      console.error('❌ No conversation selected');
      return;
    }

    const convId = selectedConversation?.conversationId || selectedConversation?.id;
    
    if (!convId) {
      console.error('❌ Selected conversation has no ID:', selectedConversation);
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

      console.log('✅ Message sent:', newMessage);
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
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // ✅ OPTIMIZED: useMemo for filtered conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    
    const searchLower = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      if (conv.conversationType === 'THREE_WAY' && conv.allParticipants) {
        return conv.allParticipants.some(p => 
          p.name.toLowerCase().includes(searchLower)
        );
      }
      return conv.otherParticipantName?.toLowerCase().includes(searchLower);
    });
  }, [conversations, searchQuery]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Loader className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Conversation List Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Messages</h2>
        </div>

        <ConversationList
          conversations={filteredConversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUserId={currentUserId} // ✅ PASS currentUserId
          unreadConversationIds={unreadConversationIds}
          compact={false}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 h-full overflow-hidden">
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          currentUserId={currentUserId}
          onSendMessage={handleSendMessage}
          isSending={isSending}
          compact={false}
        />
      </div>
    </div>
  );
}

export default MessagesPage;