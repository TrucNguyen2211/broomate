import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import tenantService from '../../services/tenantService';
import messageService from '../../services/messageService';

function TenantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    bookmarks: 0,
    matches: 0, // Kept for UI display, but not fetched from API
    messages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch all stats on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // ✅ Listen for activity updates from other pages
  useEffect(() => {
    const handleActivityUpdate = (event) => {
      const { type, data } = event.detail;
      
      // Add new activity to the top of the list
      const newActivity = {
        id: `${type}-${Date.now()}`,
        type: type,
        icon: getActivityIcon(type),
        title: getActivityTitle(type),
        description: getActivityDescription(type, data),
        time: new Date().toISOString()
      };

      setRecentActivity(prev => [newActivity, ...prev].slice(0, 5)); // Keep only 5 most recent

      // Update stats
      if (type === 'bookmark') {
        setStats(prev => ({ ...prev, bookmarks: prev.bookmarks + 1 }));
      } else if (type === 'unbookmark') {
        setStats(prev => ({ ...prev, bookmarks: Math.max(0, prev.bookmarks - 1) }));
      } else if (type === 'match') {
        setStats(prev => ({ ...prev, matches: prev.matches + 1 }));
      }
    };

    window.addEventListener('dashboardActivity', handleActivityUpdate);
    
    return () => {
      window.removeEventListener('dashboardActivity', handleActivityUpdate);
    };
  }, []);

  // ✅ Helper functions for activity display
  const getActivityIcon = (type) => {
    switch (type) {
      case 'bookmark': return '💾';
      case 'unbookmark': return '🗑️';
      case 'match': return '✨';
      case 'message': return '💬';
      default: return '📌';
    }
  };

  const getActivityTitle = (type) => {
    switch (type) {
      case 'bookmark': return 'Room Bookmarked';
      case 'unbookmark': return 'Bookmark Removed';
      case 'match': return 'New Match!';
      case 'message': return 'New Message';
      default: return 'Activity';
    }
  };

  const getActivityDescription = (type, data) => {
    switch (type) {
      case 'bookmark': 
        return data?.roomTitle ? `Saved "${data.roomTitle}"` : 'You saved a room';
      case 'unbookmark': 
        return data?.roomTitle ? `Removed "${data.roomTitle}"` : 'You removed a bookmark';
      case 'match': 
        return data?.matchName ? `You matched with ${data.matchName}!` : 'You have a new roommate match!';
      case 'message': 
        return data?.senderName ? `${data.senderName} sent you a message` : 'You have a new message';
      default: 
        return 'Recent activity';
    }
  };

  const fetchDashboardStats = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // ✅ Fetch only bookmarks and conversations (matches removed per team decision)
      const [bookmarksData, conversationsData] = await Promise.allSettled([
        tenantService.getBookmarks(),
        messageService.getAllConversations()
      ]);

      // Process bookmarks
      let bookmarksCount = 0;
      if (bookmarksData.status === 'fulfilled') {
        bookmarksCount = Array.isArray(bookmarksData.value) ? bookmarksData.value.length : 0;
      } else {
        console.warn('Could not fetch bookmarks:', bookmarksData.reason);
      }

      // Process conversations
      let messagesCount = 0;
      let conversations = [];
      if (conversationsData.status === 'fulfilled') {
        conversations = conversationsData.value.conversations || [];
        messagesCount = conversations.length;
      } else {
        console.warn('Could not fetch conversations:', conversationsData.reason);
      }

      setStats({
        bookmarks: bookmarksCount,
        matches: 0, // Matches feature not implemented per team agreement
        messages: messagesCount
      });

      // ✅ Build recent activity from conversations (showing most recent)
      // Get current user ID to determine who sent the last message
      const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').userId;
      
      const recentActivities = conversations.slice(0, 3).map(conv => {
        // ✅ Check if backend provides lastMessageSenderId
        let lastMessageFromMe = false;
        let title = 'New message';
        let description = `${conv.otherParticipantName}: ${conv.lastMessage || 'Sent you a message'}`;
        
        if (conv.lastMessageSenderId) {
          // Backend provides the sender ID - use it!
          lastMessageFromMe = conv.lastMessageSenderId === currentUserId;
          
          if (lastMessageFromMe) {
            title = 'You sent a message';
            description = `You: ${conv.lastMessage || 'Sent a message'}`;
          } else {
            title = 'New message';
            description = `${conv.otherParticipantName}: ${conv.lastMessage || 'Sent you a message'}`;
          }
        } else {
          // ⚠️ Backend doesn't provide lastMessageSenderId
          // Without this field, we can't reliably determine who sent the last message
          // Show generic activity without assuming sender
          title = 'Message activity';
          description = conv.lastMessage || `Conversation with ${conv.otherParticipantName}`;
        }
        
        return {
          id: conv.id || conv.conversationId,
          type: 'message',
          icon: '💬',
          title: title,
          description: description,
          time: conv.lastMessageAt || conv.updatedAt || conv.createdAt
        };
      });

      setRecentActivity(recentActivities);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation handlers
  const handleFindRooms = () => {
    navigate('/dashboard/tenant/find-rooms');
  };

  const handleFindRoommates = () => {
    navigate('/dashboard/tenant/find-roommates');
  };

  const handleViewBookmarks = () => {
    navigate('/dashboard/tenant/bookmarks');
  };

  const handleViewMessages = () => {
    navigate('/dashboard/messages');
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);

      if (seconds < 60) return 'Just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
      if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
      
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-white">
        <div className="text-center">
          <Loader className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 bg-gradient-to-br from-teal-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Tenant!</h1>
          <p className="text-gray-600">Find your perfect room and ideal roommate</p>
        </div>

        {/* Quick Stats - Matches removed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={handleViewBookmarks}
            className="bg-white rounded-2xl p-6 shadow-lg border border-teal-100 hover:shadow-xl transition transform hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bookmarks</h3>
              <span className="text-3xl">💾</span>
            </div>
            <p className="text-3xl font-bold text-teal-600">{stats.bookmarks}</p>
            <p className="text-sm text-gray-500 mt-2">Saved rooms</p>
          </button>

          <button
            onClick={handleViewMessages}
            className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition transform hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.messages}</p>
            <p className="text-sm text-gray-500 mt-2">Conversations</p>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={handleFindRooms}
              className="flex items-center gap-4 p-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:shadow-xl transition transform hover:scale-105"
            >
              <span className="text-4xl">🔍</span>
              <div className="text-left">
                <h3 className="font-bold text-lg">Find Rooms</h3>
                <p className="text-sm text-teal-100">Browse available listings</p>
              </div>
            </button>

            <button
              onClick={handleFindRoommates}
              className="flex items-center gap-4 p-6 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:shadow-xl transition transform hover:scale-105"
            >
              <span className="text-4xl">👥</span>
              <div className="text-left">
                <h3 className="font-bold text-lg">Find Roommates</h3>
                <p className="text-sm text-pink-100">Swipe and match</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-gray-600 mb-4">No recent activity yet</p>
              <p className="text-sm text-gray-500">Start exploring rooms and matching with roommates!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => {
                    if (activity.type === 'message') {
                      navigate('/dashboard/messages');
                    } else if (activity.type === 'bookmark' || activity.type === 'unbookmark') {
                      navigate('/dashboard/tenant/bookmarks');
                    } else if (activity.type === 'match') {
                      navigate('/dashboard/tenant/find-roommates');
                    }
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                >
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                  {activity.time && (
                    <span className="text-xs text-gray-500">{formatTimeAgo(activity.time)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary Footer - Updated to only show 2 stats */}
        {(stats.bookmarks > 0 || stats.messages > 0) && (
          <div className="mt-6 bg-gradient-to-r from-teal-50 to-purple-50 rounded-xl p-6 border border-teal-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Your Activity Summary</p>
                <p className="text-xs text-gray-600 mt-1">Keep exploring to find your perfect match!</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-teal-600 text-lg">{stats.bookmarks}</p>
                  <p className="text-gray-600 text-xs">Bookmarks</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-purple-600 text-lg">{stats.messages}</p>
                  <p className="text-gray-600 text-xs">Messages</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantDashboard;