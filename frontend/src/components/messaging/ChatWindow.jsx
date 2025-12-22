import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';  
import { ArrowLeft, MoreVertical, Loader } from 'lucide-react';

function ChatWindow({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  isSending = false,
  isLoading = false,
  compact = false
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-gray-600 dark:text-gray-400">
            Select a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  // 🔑 New logic for three-way conversations
  const isThreeWay = conversation?.conversationType === 'THREE_WAY';
  const allParticipants = conversation?.allParticipants || [];

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div
        className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${
          compact ? 'p-3' : 'p-4'
        } flex items-center justify-between flex-shrink-0`}
      >
        <div className="flex items-center gap-3">
          {/* Back Button (for compact view) */}
          {compact && onBack && (
            <button
              onClick={onBack}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          {/* Avatar */}
          {isThreeWay ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">👥</span>
            </div>
          ) : (
            <img
              src={
                conversation.otherParticipantAvatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  conversation.otherParticipantName
                )}&background=14b8a6&color=fff`
              }
              alt={conversation.otherParticipantName}
              className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover`}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  conversation.otherParticipantName
                )}&background=14b8a6&color=fff`;
              }}
            />
          )}

          {/* Info */}
          <div>
            {isThreeWay && allParticipants.length > 0 ? (
              <>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  Group Chat
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {allParticipants.map((p) => p.name).join(', ')}
                </p>
              </>
            ) : (
              <>
                <p
                  className={`font-semibold text-gray-900 dark:text-white ${
                    compact ? 'text-sm' : ''
                  }`}
                >
                  {conversation.otherParticipantName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active now</p>
              </>
            )}
          </div>
        </div>

        {/* More Options */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
          <MoreVertical
            className={`text-gray-600 dark:text-gray-400 ${
              compact ? 'w-4 h-4' : 'w-5 h-5'
            }`}
          />
        </button>
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto ${compact ? 'p-3' : 'p-6'} ${
          compact
            ? 'bg-gray-50 dark:bg-gray-900'
            : 'bg-gradient-to-br from-pink-50/30 to-teal-50/30 dark:from-gray-900 dark:to-gray-800'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className={`${compact ? 'text-4xl' : 'text-5xl'} mb-3`}>💬</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isMyMessage = msg.senderId === currentUserId;

              return (
                <MessageBubble
                  key={msg.id || index}
                  message={msg}
                  isMyMessage={isMyMessage}
                  currentUserId={currentUserId}
                  senderName={conversation.otherParticipantName}
                  compact={compact}
                  conversation={conversation}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        isSending={isSending}
        compact={compact}
      />
    </div>
  );
}

export default ChatWindow;