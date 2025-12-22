// FE/src/pages/shared/FindRoomsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, Bookmark, ChevronLeft, 
  Loader, Filter, X, Search
} from 'lucide-react';
import roomService from '../../services/roomService';
import tenantService from '../../services/tenantService';

function FindRoomsPage() {
  const navigate = useNavigate();
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isTenant = currentUser.role?.toUpperCase() === 'TENANT';

  const [rooms, setRooms] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarkingIds, setBookmarkingIds] = useState(new Set());

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    district: 'all',
    minBedrooms: '',
    minStay: '',
    hasWindow: 'all',
    sortBy: 'price-asc'
  });

  useEffect(() => {
    fetchRooms();
    if (isTenant) {
      fetchBookmarks();
    }
  }, [isTenant]);

  const fetchRooms = async () => {
    setIsLoading(true);
    setError('');

    try {
        const data = await roomService.getAllRooms();
        console.log('✅ Fetched rooms:', data);
        
        const publishedRooms = data.filter(room => 
            room.status === 'PUBLISHED'
        );
        
        console.log('📊 Published rooms:', publishedRooms.length);
        
        setRooms(publishedRooms);
    } catch (err) {
        console.error('❌ Error fetching rooms:', err);
        
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
        }
        
        setError('Failed to load rooms. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const bookmarksData = await tenantService.getBookmarks();
      console.log('✅ Fetched bookmarks:', bookmarksData);
      
      const bookmarkedRoomIds = new Set(
        (bookmarksData || []).map(b => b.room?.id || b.roomId).filter(Boolean)
      );
      console.log('📌 Bookmarked room IDs:', Array.from(bookmarkedRoomIds));
      setBookmarks(bookmarkedRoomIds);
    } catch (err) {
      console.error('❌ Error fetching bookmarks:', err);
    }
  };

  const handleToggleBookmark = async (roomId, e) => {
    e.stopPropagation();
    
    if (!isTenant) {
      alert('Only tenants can bookmark rooms');
      return;
    }

    const isBookmarked = bookmarks.has(roomId);
    setBookmarkingIds(prev => new Set(prev).add(roomId));

    try {
      if (isBookmarked) {
        await tenantService.removeBookmark(roomId);
        setBookmarks(prev => {
          const next = new Set(prev);
          next.delete(roomId);
          return next;
        });
        
        window.dispatchEvent(new CustomEvent('dashboardActivity', {
          detail: {
            type: 'unbookmark',
            data: { 
              roomId,
              roomTitle: rooms.find(r => r.id === roomId)?.title 
            }
          }
        }));
      } else {
        await tenantService.addBookmark(roomId);
        setBookmarks(prev => new Set(prev).add(roomId));
        
        window.dispatchEvent(new CustomEvent('dashboardActivity', {
          detail: {
            type: 'bookmark',
            data: { 
              roomId,
              roomTitle: rooms.find(r => r.id === roomId)?.title 
            }
          }
        }));
      }
    } catch (err) {
      console.error('❌ Error toggling bookmark:', err);
      alert(err.response?.data?.message || 'Failed to update bookmark');
    } finally {
      setBookmarkingIds(prev => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
    }
  };

  const handleViewRoom = (roomId) => {
    const basePath = isTenant ? '/dashboard/tenant' : '/dashboard/landlord';
    navigate(`${basePath}/room/${roomId}`);
  };

  const extractDistrict = (address) => {
    if (!address) return 'Unknown';
    const districtMatch = address.match(/District \d+|Binh Thanh|Phu Nhuan|Tan Binh|Go Vap|Thu Duc|Tan Phu/i);
    return districtMatch ? districtMatch[0] : 'HCMC';
  };

  const availableDistricts = [...new Set(
    rooms
      .map(r => extractDistrict(r.address))
      .filter(d => d !== 'Unknown')
  )].sort();

  const filteredRooms = rooms.filter(room => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = room.title?.toLowerCase().includes(query);
      const matchesAddress = room.address?.toLowerCase().includes(query);
      const matchesDescription = room.description?.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesAddress && !matchesDescription) {
        return false;
      }
    }

    if (filters.minPrice && room.rentPricePerMonth < parseFloat(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && room.rentPricePerMonth > parseFloat(filters.maxPrice)) {
      return false;
    }

    if (filters.district !== 'all') {
      const roomDistrict = extractDistrict(room.address);
      if (roomDistrict !== filters.district) {
        return false;
      }
    }

    if (filters.minBedrooms && room.numberOfBedRooms < parseInt(filters.minBedrooms)) {
      return false;
    }

    if (filters.minStay && room.minimumStayMonths > parseInt(filters.minStay)) {
      return false;
    }

    if (filters.hasWindow === 'yes' && !room.hasWindow) {
      return false;
    }
    if (filters.hasWindow === 'no' && room.hasWindow) {
      return false;
    }

    return true;
  });

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-asc':
        return (a.rentPricePerMonth || 0) - (b.rentPricePerMonth || 0);
      case 'price-desc':
        return (b.rentPricePerMonth || 0) - (a.rentPricePerMonth || 0);
      case 'newest':
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case 'oldest':
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      district: 'all',
      minBedrooms: '',
      minStay: '',
      hasWindow: 'all',
      sortBy: 'price-asc'
    });
    setSearchQuery('');
  };

  const hasActiveFilters = 
    filters.minPrice || 
    filters.maxPrice || 
    filters.district !== 'all' || 
    filters.minBedrooms || 
    filters.minStay || 
    filters.hasWindow !== 'all' ||
    searchQuery;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchRooms}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
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
      <div className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-20 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(isTenant ? '/dashboard/tenant' : '/dashboard/landlord')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-3 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {isTenant ? 'Find Your Perfect Room' : 'Browse Available Rooms'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {sortedRooms.length} of {rooms.length} room{rooms.length !== 1 ? 's' : ''} available
              </p>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-white text-teal-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by title, address, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Range (₫)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    District
                  </label>
                  <select
                    value={filters.district}
                    onChange={(e) => setFilters({...filters, district: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">All Districts</option>
                    {availableDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min. Bedrooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Any"
                    value={filters.minBedrooms}
                    onChange={(e) => setFilters({...filters, minBedrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Min Stay */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max. Min Stay (months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Any"
                    value={filters.minStay}
                    onChange={(e) => setFilters({...filters, minStay: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Window */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Has Window
                  </label>
                  <select
                    value={filters.hasWindow}
                    onChange={(e) => setFilters({...filters, hasWindow: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">Any</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {sortedRooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {hasActiveFilters ? 'No Rooms Match Your Filters' : 'No Rooms Available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more results' 
                : 'Check back later for new listings'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="bg-teal-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-700 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedRooms.map((room) => {
              const isBookmarked = bookmarks.has(room.id);
              const isBookmarking = bookmarkingIds.has(room.id);

              return (
                <div
                  key={room.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer"
                  onClick={() => handleViewRoom(room.id)}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative sm:w-48 h-48 sm:h-auto flex-shrink-0">
                      <img
                        src={
                          room.thumbnailUrl || 
                          room.imageUrls?.[0] || 
                          'https://placehold.co/400x300/14B8A6/FFFFFF?text=No+Image'
                        }
                        alt={room.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { 
                          e.target.src = 'https://placehold.co/400x300/14B8A6/FFFFFF?text=No+Image'; 
                        }}
                      />
                      
                      {/* Bookmark Button (Tenant Only) */}
                      {isTenant && (
                        <button
                          onClick={(e) => handleToggleBookmark(room.id, e)}
                          disabled={isBookmarking}
                          className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition ${
                            isBookmarked
                              ? 'bg-teal-500 text-white'
                              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900'
                          } ${isBookmarking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isBookmarking ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <Bookmark 
                              className="w-5 h-5" 
                              fill={isBookmarked ? 'currentColor' : 'none'}
                            />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1" title={room.title}>
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
                          {room.minimumStayMonths && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                              Min. {room.minimumStayMonths} months
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
                          <span className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-1 rounded-full">
                            🪟 Window
                          </span>
                        )}
                        {room.imageUrls && room.imageUrls.length > 0 && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                            📷 {room.imageUrls.length} photo{room.imageUrls.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {room.videoUrls && room.videoUrls.length > 0 && (
                          <span className="text-xs bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full">
                            🎥 Video tour
                          </span>
                        )}
                        {room.status && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            room.status === 'PUBLISHED' 
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : room.status === 'RENTED'
                              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {room.status}
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FindRoomsPage;