// FE/src/pages/tenant/BookmarksPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, Bookmark, ChevronLeft, 
  Loader, Trash2, ExternalLink 
} from 'lucide-react';
import tenantService from '../../services/tenantService';

function BookmarksPage() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingIds, setDeletingIds] = useState(new Set());

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await tenantService.getBookmarks();
      console.log('Fetched bookmarks:', data);
      setBookmarks(data || []);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      setError('Failed to load bookmarks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbookmark = async (roomId, bookmarkId) => {
    if (!window.confirm('Remove this room from your bookmarks?')) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(bookmarkId));

    try {
      await tenantService.removeBookmark(roomId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } catch (err) {
      console.error('Error unbookmarking:', err);
      alert('Failed to remove bookmark. Please try again.');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookmarkId);
        return newSet;
      });
    }
  };

  const handleViewRoom = (roomId) => {
    navigate(`/dashboard/tenant/room/${roomId}`);
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your bookmarks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchBookmarks}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-teal-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-10 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/dashboard/tenant')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-3 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-8 h-8 text-teal-600 dark:text-teal-400" fill="currentColor" />
                My Bookmarks
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {bookmarks.length} saved room{bookmarks.length !== 1 ? 's' : ''}
              </p>
            </div>

            {bookmarks.length > 0 && (
              <button
                onClick={() => navigate('/dashboard/tenant/find-rooms')}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Find More Rooms
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📌</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Bookmarks Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start bookmarking rooms you like to save them for later
            </p>
            <button
              onClick={() => navigate('/dashboard/tenant/find-rooms')}
              className="bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold px-6 py-3 rounded-lg hover:from-teal-600 hover:to-teal-700 transition transform hover:scale-105"
            >
              Browse Rooms
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookmarks.map((bookmark) => {
              const room = bookmark.room;
              const isDeleting = deletingIds.has(bookmark.id);

              return (
                <div
                  key={bookmark.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition overflow-hidden border border-gray-100 dark:border-gray-700 ${
                    isDeleting ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative sm:w-48 h-48 sm:h-auto flex-shrink-0">
                      <img
                        src={
                          room?.thumbnailUrl || 
                          room?.imageUrls?.[0] || 
                          'https://placehold.co/400x300/E0E0E0/666666?text=No+Image'
                        }
                        alt={room?.title || 'Room'}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => handleViewRoom(room.id)}
                        onError={(e) => { 
                          e.target.src = 'https://placehold.co/400x300/E0E0E0/666666?text=No+Image'; 
                        }}
                      />
                      
                      <div className="absolute top-3 right-3 bg-teal-500 text-white p-2 rounded-full shadow-lg">
                        <Bookmark className="w-5 h-5" fill="currentColor" />
                      </div>

                      {bookmark.bookmarkedAt && (
                        <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          Saved {formatDate(bookmark.bookmarkedAt)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col">
                      <h3
                        className="text-lg font-bold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition line-clamp-1"
                        onClick={() => handleViewRoom(room.id)}
                        title={room?.title}
                      >
                        {room?.title || 'Untitled Room'}
                      </h3>

                      {room?.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {room.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-3 flex-1">
                        {room?.address && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-teal-500 dark:text-teal-400 flex-shrink-0" />
                            <span className="line-clamp-1" title={room.address}>
                              {room.address}
                            </span>
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                          {room?.minimumStayMonths && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                              Min. {room.minimumStayMonths} months
                            </span>
                          )}
                          {room?.numberOfBedRooms !== undefined && (
                            <span className="flex items-center gap-1">
                              🛏️ {room.numberOfBedRooms} bed{room.numberOfBedRooms !== 1 ? 's' : ''}
                            </span>
                          )}
                          {room?.numberOfToilets !== undefined && (
                            <span className="flex items-center gap-1">
                              🚽 {room.numberOfToilets} toilet{room.numberOfToilets !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {room?.hasWindow && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                            🪟 Window
                          </span>
                        )}
                        {room?.imageUrls && room.imageUrls.length > 0 && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                            📷 {room.imageUrls.length} photo{room.imageUrls.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {room?.videoUrls && room.videoUrls.length > 0 && (
                          <span className="text-xs bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full">
                            🎥 Video tour
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {room?.address ? extractDistrict(room.address) : 'HCMC'}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                            {room.rentPricePerMonth?.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-xl font-bold text-teal-600 dark:text-teal-400">₫</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleViewRoom(room.id)}
                          className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-teal-600 hover:to-teal-700 transition flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleUnbookmark(room.id, bookmark.id)}
                          disabled={isDeleting}
                          className="flex items-center justify-center px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove bookmark"
                        >
                          {isDeleting ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {bookmarks.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
          <button
            onClick={() => navigate('/dashboard/tenant/find-rooms')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-semibold"
          >
            <ExternalLink className="w-5 h-5" />
            Find More Rooms
          </button>
        </div>
      )}
    </div>
  );
}

export default BookmarksPage;