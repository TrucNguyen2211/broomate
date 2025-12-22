// FE/src/pages/landlord/LandlordDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Upload, Home, MessageSquare, TrendingUp } from 'lucide-react';
import landlordService from '../../services/landlordService';
import messageService from '../../services/messageService';

function LandlordDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    publishedRooms: 0,
    rentedRooms: 0,
    conversations: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentRooms, setRecentRooms] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const [roomsData, conversationsData] = await Promise.allSettled([
        landlordService.getMyRooms(),
        messageService.getAllConversations()
      ]);

      let rooms = [];
      if (roomsData.status === 'fulfilled') {
        rooms = Array.isArray(roomsData.value) ? roomsData.value : [];
      } else {
        console.warn('Could not fetch rooms:', roomsData.reason);
      }

      const totalRooms = rooms.length;
      const publishedRooms = rooms.filter(r => r.status === 'PUBLISHED').length;
      const rentedRooms = rooms.filter(r => r.status === 'RENTED').length;

      let conversationsCount = 0;
      let conversations = [];
      if (conversationsData.status === 'fulfilled') {
        conversations = conversationsData.value.conversations || [];
        conversationsCount = conversations.length;
      } else {
        console.warn('Could not fetch conversations:', conversationsData.reason);
      }

      setStats({
        totalRooms,
        publishedRooms,
        rentedRooms,
        conversations: conversationsCount
      });

      const sortedRooms = [...rooms].sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setRecentRooms(sortedRooms.slice(0, 3));

      const roomActivities = sortedRooms.slice(0, 3).map(room => ({
        id: room.id,
        type: 'room',
        icon: room.status === 'RENTED' ? '🏠' : '📢',
        title: room.status === 'RENTED' ? 'Room Rented' : 'Room Published',
        description: room.title,
        time: room.createdAt || room.updatedAt
      }));

      const messageActivities = conversations.slice(0, 2).map(conv => ({
        id: conv.id || conv.conversationId,
        type: 'message',
        icon: '💬',
        title: 'New message',
        description: `${conv.otherParticipantName}: ${conv.lastMessage || 'Sent you a message'}`,
        time: conv.lastMessageAt || conv.updatedAt || conv.createdAt
      }));

      const allActivities = [...roomActivities, ...messageActivities]
        .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
        .slice(0, 5);

      setRecentActivity(allActivities);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadRoom = () => {
    navigate('/dashboard/landlord/upload-room');
  };

  const handleViewMyRooms = () => {
    navigate('/dashboard/landlord/my-rooms');
  };

  const handleViewMessages = () => {
    navigate('/dashboard/messages');
  };

  const handleViewRoom = (roomId) => {
    navigate(`/dashboard/landlord/room/${roomId}`);
  };

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

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {currentUser.name || 'Landlord'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your properties and connect with tenants</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={handleViewMyRooms}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-blue-100 dark:border-blue-900 hover:shadow-xl transition transform hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Rooms</h3>
              <span className="text-3xl">🏘️</span>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalRooms}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">All properties</p>
          </button>

          <button
            onClick={handleViewMyRooms}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-green-100 dark:border-green-900 hover:shadow-xl transition transform hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Published</h3>
              <span className="text-3xl">📢</span>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.publishedRooms}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Available rooms</p>
          </button>

          <button
            onClick={handleViewMyRooms}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-red-100 dark:border-red-900 hover:shadow-xl transition transform hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rented</h3>
              <span className="text-3xl">🏠</span>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.rentedRooms}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Occupied</p>
          </button>

          <button
            onClick={handleViewMessages}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-purple-100 dark:border-purple-900 hover:shadow-xl transition transform hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.conversations}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Conversations</p>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={handleUploadRoom}
              className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-xl transition transform hover:scale-105"
            >
              <Upload className="w-10 h-10" />
              <div className="text-left">
                <h3 className="font-bold text-lg">Upload New Room</h3>
                <p className="text-sm text-blue-100">List a new property</p>
              </div>
            </button>

            <button
              onClick={handleViewMyRooms}
              className="flex items-center gap-4 p-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:shadow-xl transition transform hover:scale-105"
            >
              <Home className="w-10 h-10" />
              <div className="text-left">
                <h3 className="font-bold text-lg">My Rooms</h3>
                <p className="text-sm text-teal-100">View and manage listings</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Rooms</h2>
              <button
                onClick={handleViewMyRooms}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
              >
                View All →
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleViewRoom(room.id)}
                  className="group bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition text-left"
                >
                  <div className="relative h-48 bg-gray-200 dark:bg-gray-600 overflow-hidden">
                    <img
                      src={room.thumbnailUrl || 'https://placehold.co/400x300/3B82F6/FFFFFF?text=No+Image'}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                      room.status === 'PUBLISHED' ? 'bg-green-500 text-white' :
                      room.status === 'RENTED' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {room.status}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{room.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">{room.address}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{formatPrice(room.rentPricePerMonth)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{room.minimumStayMonths}+ months</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🏘️</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">No recent activity yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Upload your first room to get started!</p>
              <button
                onClick={handleUploadRoom}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Upload Room
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => {
                    if (activity.type === 'message') {
                      navigate('/dashboard/messages');
                    } else if (activity.type === 'room') {
                      handleViewRoom(activity.id);
                    }
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition text-left"
                >
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{activity.description}</p>
                  </div>
                  {activity.time && (
                    <span className="text-xs text-gray-500 dark:text-gray-500">{formatTimeAgo(activity.time)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary Footer */}
        {stats.totalRooms > 0 && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Portfolio Summary</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Keep your listings updated for better visibility!</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">{stats.totalRooms}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Total</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-green-600 dark:text-green-400 text-lg">{stats.publishedRooms}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Published</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-red-600 dark:text-red-400 text-lg">{stats.rentedRooms}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Rented</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LandlordDashboard;