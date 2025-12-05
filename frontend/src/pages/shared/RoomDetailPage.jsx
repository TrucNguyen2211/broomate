import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, Calendar, Bookmark, ChevronLeft, Loader,
  Bed, Bath, CheckCircle, XCircle, Upload, X, 
  ChevronRight, Download, FileText, Image as ImageIcon, Video as VideoIcon
} from 'lucide-react';
import roomService from "../../services/roomService";
import landlordService from "../../services/landlordService";
import tenantService from "../../services/tenantService";

function RoomDetailPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Room data
  const [room, setRoom] = useState(location.state?.room || null);
  const [formRoom, setFormRoom] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Media gallery state
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [allMedia, setAllMedia] = useState([]); // Combined images + videos

  // Media state for editing
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [videosToRemove, setVideosToRemove] = useState([]);
  const [documentsToRemove, setDocumentsToRemove] = useState([]);
  const [replaceThumbnail, setReplaceThumbnail] = useState(false);
  const [newThumbnail, setNewThumbnail] = useState(null);

  // Refs for file inputs
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  // UI states
  const [loading, setLoading] = useState(!location.state?.room);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState(null);

  // Line 46-49 - Make sure it uses toUpperCase()
  const isTenant = currentUser.role?.toUpperCase() === 'TENANT';
  const isOwnerLandlord =
    currentUser.role?.toUpperCase() === 'LANDLORD' &&
    currentUser.userId === room?.landlordId;

  // ✅ Fetch room data by ID if not passed via location.state
  useEffect(() => {
    if (!room && roomId) {
      fetchRoomById();
    }
  }, [room, roomId]);

  // ✅ Check if room is bookmarked (tenant only)
  useEffect(() => {
    if (room && isTenant) {
      checkIfBookmarked();
    }
  }, [room, isTenant]);

  const fetchRoomById = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await roomService.getRoomById(roomId);
      console.log('Fetched room:', data);
      setRoom(data);
    } catch (err) {
      console.error('Error fetching room:', err);
      setError(err.response?.data?.message || 'Room not found');
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkIfBookmarked = async () => {
    try {
      const bookmarks = await tenantService.getBookmarks();
      const isBookmarked = bookmarks.some(b => 
        (b.room?.id || b.roomId) === room.id
      );
      setBookmarked(isBookmarked);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
    }
  };

  // Initialize form data when room loads
  useEffect(() => {
    if (!room) return;

    setFormRoom({
      id: room.id,
      title: room.title || "",
      description: room.description || "",
      rentPricePerMonth: room.rentPricePerMonth || "",
      minimumStayMonths: room.minimumStayMonths || 1,
      address: room.address || "",
      latitude: room.latitude || "",
      longitude: room.longitude || "",
      numberOfToilets: room.numberOfToilets || 1,
      numberOfBedRooms: room.numberOfBedRooms || 1,
      hasWindow: typeof room.hasWindow === "boolean" ? room.hasWindow : true,
      status: room.status || "PUBLISHED",
      landlordId: room.landlordId,
      thumbnailUrl: room.thumbnailUrl,
      imageUrls: room.imageUrls || [],
      videoUrls: room.videoUrls || [],
      documentUrls: room.documentUrls || [],
    });

    // ✅ Build combined media array (images + videos)
    const media = [];

    // 1. Add thumbnail FIRST (if exists)
    if (room.thumbnailUrl) {
      media.push({ type: 'image', url: room.thumbnailUrl, isThumbnail: true });
    }
    
    // 2. Add all images (excluding thumbnail if it's in imageUrls)
    if (room.imageUrls && room.imageUrls.length > 0) {
      room.imageUrls.forEach(url => {
        // Skip if this image is the same as thumbnail (avoid duplicates)
        if (url !== room.thumbnailUrl) {
          media.push({ type: 'image', url });
        }
      });
    }
    
    // Add all videos
    if (room.videoUrls && room.videoUrls.length > 0) {
      room.videoUrls.forEach(url => {
        media.push({ type: 'video', url });
      });
    }

    console.log('📸 Media array built:', media); // ✅ Debug log to verify

    setAllMedia(media);
    setCurrentMediaIndex(0);

    // Reset media editing state
    setNewImages([]);
    setNewVideos([]);
    setNewDocuments([]);
    setImagesToRemove([]);
    setVideosToRemove([]);
    setDocumentsToRemove([]);
    setReplaceThumbnail(false);
    setNewThumbnail(null);
  }, [room]);

  /* ---------- Form handlers ---------- */
  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "number" ? e.target.valueAsNumber || "" : e.target.value;
    setFormRoom((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckbox = (field) => (e) => {
    setFormRoom((prev) => ({ ...prev, [field]: e.target.checked }));
  };

  const handleSelect = (field) => (e) => {
    setFormRoom((prev) => ({ ...prev, [field]: e.target.value }));
  };

  /* ---------- Media gallery navigation ---------- */
  const handlePrevMedia = () => {
    setCurrentMediaIndex((prev) => 
      prev === 0 ? allMedia.length - 1 : prev - 1
    );
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex((prev) => 
      prev === allMedia.length - 1 ? 0 : prev + 1
    );
  };

  /* ---------- Media handlers ---------- */
  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewThumbnail(file);
      setReplaceThumbnail(true);
    }
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files || []);
    const currentTotal = (formRoom.imageUrls?.length || 0) - imagesToRemove.length + newImages.length;
    const available = 3 - currentTotal;
    
    if (files.length > available) {
      alert(`You can only add ${available} more image(s). Maximum is 3 images total.`);
      setNewImages(prev => [...prev, ...files.slice(0, available)]);
    } else {
      setNewImages(prev => [...prev, ...files]);
    }
  };

  const handleAddVideos = (e) => {
    const files = Array.from(e.target.files || []);
    const currentTotal = (formRoom.videoUrls?.length || 0) - videosToRemove.length + newVideos.length;
    const available = 2 - currentTotal;
    
    if (files.length > available) {
      alert(`You can only add ${available} more video(s). Maximum is 2 videos total.`);
      setNewVideos(prev => [...prev, ...files.slice(0, available)]);
    } else {
      setNewVideos(prev => [...prev, ...files]);
    }
  };

  const handleAddDocuments = (e) => {
    const files = Array.from(e.target.files || []);
    const currentTotal = (formRoom.documentUrls?.length || 0) - documentsToRemove.length + newDocuments.length;
    const available = 3 - currentTotal;
    
    if (files.length > available) {
      alert(`You can only add ${available} more document(s). Maximum is 3 documents total.`);
      setNewDocuments(prev => [...prev, ...files.slice(0, available)]);
    } else {
      setNewDocuments(prev => [...prev, ...files]);
    }
  };

  const toggleRemoveImage = (url) => {
    setImagesToRemove(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const toggleRemoveVideo = (url) => {
    setVideosToRemove(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const toggleRemoveDocument = (url) => {
    setDocumentsToRemove(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewVideo = (index) => {
    setNewVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewDocument = (index) => {
    setNewDocuments(prev => prev.filter((_, i) => i !== index));
  };

  /* ---------- Save edit ---------- */
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // Basic fields matching backend parameter names
    formData.append('title', formRoom.title);
    formData.append('description', formRoom.description || '');
    formData.append('rentPricePerMonth', Number(formRoom.rentPricePerMonth) || 0);
    formData.append('minimumStayMonths', formRoom.minimumStayMonths || 1);
    formData.append('address', formRoom.address);

    if (formRoom.latitude) formData.append('latitude', formRoom.latitude);
    if (formRoom.longitude) formData.append('longitude', formRoom.longitude);

    formData.append('numberOfToilets', formRoom.numberOfToilets || 1);
    formData.append('numberOfBedRooms', formRoom.numberOfBedRooms || 1);
    formData.append('hasWindow', formRoom.hasWindow);
    formData.append('status', formRoom.status);

    // ✅ Media removal - send as arrays
    if (imagesToRemove.length > 0) {
      imagesToRemove.forEach(url => formData.append('imagesToRemove', url));
    }
    if (videosToRemove.length > 0) {
      videosToRemove.forEach(url => formData.append('videosToRemove', url));
    }
    if (documentsToRemove.length > 0) {
      documentsToRemove.forEach(url => formData.append('documentsToRemove', url));
    }

    // ✅ Thumbnail replacement
    formData.append('replaceThumbnail', replaceThumbnail);
    if (newThumbnail) {
      formData.append('thumbnail', newThumbnail);
    }

    // ✅ New media files
    newImages.forEach(file => formData.append('images', file));
    newVideos.forEach(file => formData.append('videos', file));
    newDocuments.forEach(file => formData.append('documents', file));

    try {
      setSaving(true);
      setSaveMessage("");
      setError(null);

      console.log('Updating room with media...');

      const updatedRoom = await landlordService.updateRoom(formRoom.id, formData);

      console.log('Room updated successfully:', updatedRoom);

      setRoom(updatedRoom);
      setFormRoom(updatedRoom);
      setSaving(false);
      setIsEditing(false);
      setSaveMessage("Room updated successfully.");

      // Reset media state
      setNewImages([]);
      setNewVideos([]);
      setNewDocuments([]);
      setImagesToRemove([]);
      setVideosToRemove([]);
      setDocumentsToRemove([]);
      setReplaceThumbnail(false);
      setNewThumbnail(null);

      setTimeout(() => setSaveMessage(""), 3000);

    } catch (err) {
      console.error('Failed to update room:', err);
      setSaving(false);
      setError(err.response?.data?.message || 'Failed to update room');
      setSaveMessage("");

      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  /* ---------- Bookmark handling (tenant) ---------- */
  const handleToggleBookmark = async () => {
    if (!isTenant) {
      alert('Only tenants can bookmark rooms');
      return;
    }

    setBookmarking(true);

    try {
      if (bookmarked) {
        await tenantService.removeBookmark(room.id);
        setBookmarked(false);
        
        window.dispatchEvent(new CustomEvent('dashboardActivity', {
          detail: { type: 'unbookmark', data: { roomId: room.id, roomTitle: room.title } }
        }));
      } else {
        await tenantService.addBookmark(room.id);
        setBookmarked(true);
        
        window.dispatchEvent(new CustomEvent('dashboardActivity', {
          detail: { type: 'bookmark', data: { roomId: room.id, roomTitle: room.title } }
        }));
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      alert(err.response?.data?.message || 'Failed to update bookmark');
    } finally {
      setBookmarking(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-white">
        <div className="text-center">
          <Loader className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading room details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !formRoom) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-white p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Room Not Found</h3>
          <p className="text-red-600 mb-4">{error || 'This room does not exist or has been removed'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentMedia = allMedia[currentMediaIndex];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-teal-50 to-white">
      {/* Overlay saving */}
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 text-center">
            <Loader className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Saving your changes…</p>
            <p className="text-sm text-gray-600">
              Please wait while we update your room.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Success message */}
        {saveMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-800"><strong>Success:</strong> {saveMessage}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800"><strong>Error:</strong> {error}</p>
          </div>
        )}

        {/* ✅ MEDIA GALLERY CAROUSEL */}
        {allMedia.length > 0 && (
          <div className="relative h-96 rounded-2xl overflow-hidden mb-6 shadow-lg bg-black">
            {/* Current Media Display */}
            {currentMedia?.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt={`Media ${currentMediaIndex + 1}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/1200x600/14B8A6/FFFFFF?text=Image+Not+Available';
                }}
              />
            ) : currentMedia?.type === 'video' ? (
              <video
                key={currentMedia.url}
                src={currentMedia.url}
                className="w-full h-full object-contain"
                controls
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            ) : null}

            {/* Bookmark Button (Tenant Only) */}
            {isTenant && (
              <button
                onClick={handleToggleBookmark}
                disabled={bookmarking}
                className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition ${
                  bookmarked
                    ? 'bg-teal-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-teal-50'
                } ${bookmarking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {bookmarking ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <Bookmark className="w-6 h-6" fill={bookmarked ? 'currentColor' : 'none'} />
                )}
              </button>
            )}

            {/* Status Badge */}
            {formRoom.status && (
              <div className={`absolute top-4 left-4 px-4 py-2 rounded-full font-semibold text-sm shadow-lg ${
                formRoom.status === 'PUBLISHED'
                  ? 'bg-green-500 text-white'
                  : formRoom.status === 'RENTED'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}>
                {formRoom.status}
              </div>
            )}

            {/* Navigation Arrows */}
            {allMedia.length > 1 && (
              <>
                <button
                  onClick={handlePrevMedia}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg transition"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextMedia}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg transition"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Media Counter & Type Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full flex items-center gap-2">
              {currentMedia?.type === 'image' ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <VideoIcon className="w-4 h-4" />
              )}
              <span className="font-semibold">
                {currentMediaIndex + 1} / {allMedia.length}
              </span>
            </div>
          </div>
        )}

        {/* ✅ THUMBNAIL NAVIGATION (if multiple media) */}
        {allMedia.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {allMedia.map((media, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentMediaIndex(idx)}
                className={`flex-shrink-0 relative w-24 h-24 rounded-lg overflow-hidden border-2 transition ${
                  currentMediaIndex === idx
                    ? 'border-teal-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <VideoIcon className="w-8 h-8 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Room Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Price */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {formRoom.title || "Room Title"}
              </h1>
              
              {formRoom.address && (
                <p className="text-gray-600 flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-teal-500" />
                  {formRoom.address}
                </p>
              )}

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-teal-600">
                  {formRoom.rentPricePerMonth?.toLocaleString('vi-VN')}
                </span>
                <span className="text-4xl font-bold text-teal-600">₫</span>
                <span className="text-xl text-gray-500">/month</span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg">
                  <Bed className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-xs text-gray-600">Bedrooms</p>
                    <p className="font-semibold text-gray-900">{formRoom.numberOfBedRooms}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Bath className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Bathrooms</p>
                    <p className="font-semibold text-gray-900">{formRoom.numberOfToilets}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Min. Stay</p>
                    <p className="font-semibold text-gray-900">{formRoom.minimumStayMonths}mo</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  {formRoom.hasWindow ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-xs text-gray-600">Window</p>
                    <p className="font-semibold text-gray-900">
                      {formRoom.hasWindow ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isOwnerLandlord && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="w-full bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition"
                  >
                    {isEditing ? 'Cancel Editing' : 'Edit Room Details'}
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            {!isEditing && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About This Room</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {formRoom.description || "No description provided."}
                </p>
              </div>
            )}

            {/* ✅ DOCUMENTS SECTION */}
            {!isEditing && formRoom.documentUrls && formRoom.documentUrls.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-teal-600" />
                  Documents
                </h2>
                <div className="space-y-2">
                  {formRoom.documentUrls.map((url, idx) => {
                    const filename = url.split('/').pop() || `Document ${idx + 1}`;
                    return (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-teal-600" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {filename}
                          </span>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Edit Form (Owner Only) */}
            {isOwnerLandlord && isEditing && (
              <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Room Details</h2>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formRoom.title}
                      onChange={handleChange("title")}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={formRoom.description}
                      onChange={handleChange("description")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={formRoom.address}
                      onChange={handleChange("address")}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Rent (₫) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formRoom.rentPricePerMonth}
                        onChange={handleChange("rentPricePerMonth")}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min. Stay (months) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formRoom.minimumStayMonths}
                        onChange={handleChange("minimumStayMonths")}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bedrooms *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formRoom.numberOfBedRooms}
                        onChange={handleChange("numberOfBedRooms")}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bathrooms *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formRoom.numberOfToilets}
                        onChange={handleChange("numberOfToilets")}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formRoom.status}
                        onChange={handleSelect("status")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="PUBLISHED">Published</option>
                        <option value="RENTED">Rented</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="hasWindow"
                        checked={formRoom.hasWindow}
                        onChange={handleCheckbox("hasWindow")}
                        className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <label htmlFor="hasWindow" className="text-sm font-medium text-gray-700">
                        Has Window
                      </label>
                    </div>
                  </div>
                </div>

                {/* Media Management */}
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900">Manage Media</h3>

                  {/* Thumbnail */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thumbnail
                    </label>
                    {formRoom.thumbnailUrl && !replaceThumbnail && (
                      <div className="mb-2">
                        <img
                          src={formRoom.thumbnailUrl}
                          alt="Current thumbnail"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Upload className="w-4 h-4" />
                      {replaceThumbnail ? 'Replace Thumbnail' : 'Upload New Thumbnail'}
                    </button>
                    {newThumbnail && (
                      <p className="text-sm text-green-600 mt-2">✓ New thumbnail selected: {newThumbnail.name}</p>
                    )}
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Images ({(formRoom.imageUrls?.length || 0) - imagesToRemove.length + newImages.length}/3)
                    </label>
                    
                    {/* Existing images */}
                    {formRoom.imageUrls && formRoom.imageUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {formRoom.imageUrls.map((url, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={url}
                              alt={`Image ${idx + 1}`}
                              className={`w-full h-24 object-cover rounded-lg ${
                                imagesToRemove.includes(url) ? 'opacity-30' : ''
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => toggleRemoveImage(url)}
                              className={`absolute top-1 right-1 p-1 rounded-full ${
                                imagesToRemove.includes(url)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {imagesToRemove.includes(url) ? '↺' : <X className="w-4 h-4" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New images */}
                    {newImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {newImages.map((file, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-green-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeNewImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddImages}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={(formRoom.imageUrls?.length || 0) - imagesToRemove.length + newImages.length >= 3}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      Add Images
                    </button>
                  </div>

                  {/* Videos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Videos ({(formRoom.videoUrls?.length || 0) - videosToRemove.length + newVideos.length}/2)
                    </label>
                    
                    {/* Existing videos */}
                    {formRoom.videoUrls && formRoom.videoUrls.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {formRoom.videoUrls.map((url, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-2 border rounded-lg ${
                            videosToRemove.includes(url) ? 'opacity-30 bg-gray-50' : ''
                          }`}>
                            <span className="text-sm truncate">Video {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => toggleRemoveVideo(url)}
                              className={`px-3 py-1 rounded text-sm ${
                                videosToRemove.includes(url)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {videosToRemove.includes(url) ? 'Undo' : 'Remove'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New videos */}
                    {newVideos.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {newVideos.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 border-2 border-green-500 rounded-lg">
                            <span className="text-sm truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeNewVideo(idx)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleAddVideos}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={(formRoom.videoUrls?.length || 0) - videosToRemove.length + newVideos.length >= 2}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      Add Videos
                    </button>
                  </div>

                  {/* Documents */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documents ({(formRoom.documentUrls?.length || 0) - documentsToRemove.length + newDocuments.length}/3)
                    </label>
                    
                    {/* Existing documents */}
                    {formRoom.documentUrls && formRoom.documentUrls.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {formRoom.documentUrls.map((url, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-2 border rounded-lg ${
                            documentsToRemove.includes(url) ? 'opacity-30 bg-gray-50' : ''
                          }`}>
                            <span className="text-sm truncate">Document {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => toggleRemoveDocument(url)}
                              className={`px-3 py-1 rounded text-sm ${
                                documentsToRemove.includes(url)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {documentsToRemove.includes(url) ? 'Undo' : 'Remove'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New documents */}
                    {newDocuments.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {newDocuments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 border-2 border-green-500 rounded-lg">
                            <span className="text-sm truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeNewDocument(idx)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      ref={documentInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                      multiple
                      onChange={handleAddDocuments}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => documentInputRef.current?.click()}
                      disabled={(formRoom.documentUrls?.length || 0) - documentsToRemove.length + newDocuments.length >= 3}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      Add Documents
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition"
                >
                  Save All Changes
                </button>
              </form>
            )}
          </div>

          {/* Right: Landlord Info & Location */}
          <div className="space-y-6">
            {/* Landlord Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Landlord</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-2xl">
                  🧑🏻‍💼
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Property Owner</p>
                  <p className="text-sm text-teal-600">Verified landlord</p>
                </div>
              </div>
            </div>

            {/* Media Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Media</h3>
              <div className="space-y-2">
                {formRoom.imageUrls && formRoom.imageUrls.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ImageIcon className="w-5 h-5 text-teal-600" />
                    <span>{formRoom.imageUrls.length} photo{formRoom.imageUrls.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {formRoom.videoUrls && formRoom.videoUrls.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <VideoIcon className="w-5 h-5 text-purple-600" />
                    <span>{formRoom.videoUrls.length} video{formRoom.videoUrls.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {formRoom.documentUrls && formRoom.documentUrls.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>{formRoom.documentUrls.length} document{formRoom.documentUrls.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {!formRoom.imageUrls?.length && !formRoom.videoUrls?.length && !formRoom.documentUrls?.length && (
                  <p className="text-sm text-gray-500">No media uploaded</p>
                )}
              </div>
            </div>

            {/* Location */}
            {(formRoom.latitude && formRoom.longitude) && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Location</h3>
                <p className="text-sm text-gray-600">
                  <strong>Coordinates:</strong><br />
                  {formRoom.latitude}, {formRoom.longitude}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomDetailPage;