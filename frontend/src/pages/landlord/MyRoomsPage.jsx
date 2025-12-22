// FE/src/pages/landlord/MyRoomsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, ChevronLeft, Loader, Eye, Plus
} from 'lucide-react';
import landlordService from '../../services/landlordService';

function MyRoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMyRooms();
  }, []);

  const fetchMyRooms = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Calling landlordService.getMyRooms()...');
      console.log('📍 API endpoint: /landlord/rooms');
      console.log('👤 Current user:', localStorage.getItem('user'));
      console.log('🔑 Token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
      
      const data = await landlordService.getMyRooms();
      
      console.log('✅ Fetched my rooms:', data);
      console.log('📊 Number of rooms:', data?.length || 0);
      console.log('🔍 Response type:', typeof data, Array.isArray(data));

      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error fetching rooms:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error data:', err.response?.data);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      if (err.response?.status === 403) {
        setError('Access denied. Only landlords can view this page.');
        return;
      }
      
      setError(err.response?.data?.message || 'Failed to load your rooms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRoom = (roomId) => {
    navigate(`/dashboard/landlord/room/${roomId}`);
  };

  const extractDistrict = (address) => {
    if (!address) return 'Unknown';
    const districtMatch = address.match(/District \d+|Binh Thanh|Phu Nhuan|Tan Binh|Go Vap|Thu Duc|Tan Phu/i);
    return districtMatch ? districtMatch[0] : 'HCMC';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'RENTED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300';
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (filter === 'all') return true;
    return room.status === filter;
  });

  const statusCounts = {
    all: rooms.length,
    PUBLISHED: rooms.filter(r => r.status === 'PUBLISHED').length,
    RENTED: rooms.filter(r => r.status === 'RENTED').length,
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4 font-medium">{error}</p>
          <button
            onClick={fetchMyRooms}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/dashboard/landlord')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-3 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🏘️ My Rooms
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} 
                {filter !== 'all' && ` (${filter})`}
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard/landlord/upload-room')}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-semibold"
            >
              <Plus className="w-5 h-5" />
              Upload New Room
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All Rooms', count: statusCounts.all },
              { key: 'PUBLISHED', label: 'Published', count: statusCounts.PUBLISHED },
              { key: 'RENTED', label: 'Rented', count: statusCounts.RENTED },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  filter === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filter === 'all' ? 'No Rooms Yet' : `No ${filter} Rooms`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Start by uploading your first room' 
                : `You don't have any ${filter.toLowerCase()} rooms yet`}
            </p>
            {filter === 'all' ? (
              <button
                onClick={() => navigate('/dashboard/landlord/upload-room')}
                className="bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold px-6 py-3 rounded-lg hover:from-teal-600 hover:to-teal-700 transition transform hover:scale-105"
              >
                Upload Your First Room
              </button>
            ) : (
              <button
                onClick={() => setFilter('all')}
                className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 transition"
              >
                View All Rooms
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition overflow-hidden border border-gray-100 dark:border-gray-700"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="relative sm:w-48 h-48 sm:h-auto flex-shrink-0">
                    <img
                      src={
                        room.thumbnailUrl || 
                        room.imageUrls?.[0] || 
                        'https://placehold.co/400x300/3B82F6/FFFFFF?text=No+Image'
                      }
                      alt={room.title || 'Room'}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => handleViewRoom(room.id)}
                      onError={(e) => { 
                        e.target.src = 'https://placehold.co/400x300/3B82F6/FFFFFF?text=No+Image'; 
                      }}
                    />
                    
                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${getStatusColor(room.status)}`}>
                      {room.status}
                    </div>

                    {/* Created Date */}
                    {room.createdAt && (
                      <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(room.createdAt)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col">
                    <h3
                      className="text-lg font-bold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition line-clamp-1"
                      onClick={() => handleViewRoom(room.id)}
                      title={room.title}
                    >
                      {room.title || 'Untitled Room'}
                    </h3>

                    {/* Description */}
                    {room.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-3 flex-1">
                      {room.address && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-teal-500 dark:text-teal-400 flex-shrink-0" />
                          <span className="line-clamp-1" title={room.address}>
                            {room.address}
                          </span>
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                        {room.minimumStayMonths !== undefined && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                            Min. {room.minimumStayMonths} {room.minimumStayMonths === 1 ? 'month' : 'months'}
                          </span>
                        )}
                        {room.numberOfBedRooms !== undefined && (
                          <span className="flex items-center gap-1">
                            🛏️ {room.numberOfBedRooms} bed{room.numberOfBedRooms !== 1 ? 's' : ''}
                          </span>
                        )}
                        {room.numberOfToilets !== undefined && (
                          <span className="flex items-center gap-1">
                            🚽 {room.numberOfToilets} toilet{room.numberOfToilets !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {room.hasWindow && (
                        <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-1 rounded-full">
                          🪟 Window
                        </span>
                      )}
                      {room.imageUrls && room.imageUrls.length > 0 && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                          📷 {room.imageUrls.length} photo{room.imageUrls.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {room.videoUrls && room.videoUrls.length > 0 && (
                        <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full">
                          🎥 {room.videoUrls.length} video{room.videoUrls.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {room.address ? extractDistrict(room.address) : 'HCMC'}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                          {room.rentPricePerMonth?.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xl font-bold text-teal-600 dark:text-teal-400">₫</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleViewRoom(room.id)}
                      className="w-full mt-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-teal-600 hover:to-teal-700 transition flex items-center justify-center gap-2"
                      title="View & Edit details"
                    >
                      <Eye className="w-4 h-4" />
                      View & Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA for mobile */}
      {filteredRooms.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
          <button
            onClick={() => navigate('/dashboard/landlord/upload-room')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            Upload New Room
          </button>
        </div>
      )}
    </div>
  );
}

export default MyRoomsPage;