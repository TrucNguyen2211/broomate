// FE/src/components/messaging/ConversationList.jsx

import React from 'react';
import { Search } from 'lucide-react';

function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  compact = false
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Bar */}
      <div className={`${compact ? 'p-3' : 'p-4'} border-b border-gray-200 flex-shrink-0`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-500 text-sm">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const convId = conversation.id || conversation.conversationId;
            const isSelected = 
              selectedConversation?.id === convId || 
              selectedConversation?.conversationId === convId;
            
            // ✅ Check if conversation has unread messages
            const hasUnread = (conversation.unreadCount || 0) > 0;

            return (
              <button
                key={convId}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition border-b border-gray-100 ${
                  isSelected ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
                }`}
              >
                {/* Avatar with Unread Indicator */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      conversation.otherParticipantAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        conversation.otherParticipantName
                      )}&background=14b8a6&color=fff`
                    }
                    alt={conversation.otherParticipantName}
                    className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover`}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        conversation.otherParticipantName
                      )}&background=14b8a6&color=fff`;
                    }}
                  />
                  
                  {/* ✅ Small red dot for unread (visual indicator only) */}
                  {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0 text-left">
                  {/* ✅ Name - Bold if unread */}
                  <p className={`${compact ? 'text-sm' : 'text-base'} truncate ${
                    hasUnread 
                      ? 'font-bold text-gray-900' 
                      : 'font-medium text-gray-700'
                  }`}>
                    {conversation.otherParticipantName}
                  </p>

                  {/* ✅ Last Message - Bold if unread */}
                  <p className={`text-xs truncate ${
                    hasUnread 
                      ? 'font-semibold text-gray-900' 
                      : 'text-gray-500'
                  }`}>
                    {conversation.lastMessage || 'No messages yet'}
                  </p>

                  {/* Timestamp */}
                  {conversation.lastMessageAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(conversation.lastMessageAt).toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>

                {/* ❌ REMOVED: Unread count badge - Only Navbar shows count */}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConversationList;