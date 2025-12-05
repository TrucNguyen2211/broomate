import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import landlordService from "../../services/landlordService";
import Confetti from "react-confetti";
import aiService from "../../services/aiService"; // ✅ ADD THIS
import ImageVerificationModal from "../../components/landlord/ImageVerificationModal"; // ✅ ADD THIS

const FALLBACK_IMG = "https://placehold.co/400x300/3B82F6/FFFFFF?text=No+Image";

const formatVnd = (n) =>
  !n
    ? ""
    : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(n);

export default function UploadRoomPage() {
  const navigate = useNavigate();

  const [room, setRoom] = useState({
    title: "",
    description: "",
    rentPricePerMonth: "",
    minimumStayMonths: 1,
    address: "",
    latitude: "",
    longitude: "",
    numberOfToilets: 1,
    numberOfBedRooms: 1,
    hasWindow: true,
  });

  // media state
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);

    // ✅ ADD: Image verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationResults, setVerificationResults] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);

  // UI state
  const [submitted, setSubmitted] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [error, setError] = useState(null);

  // input refs
  const imgInputRef = useRef(null);
  const vidInputRef = useRef(null);
  const docInputRef = useRef(null);

  // index preview
  const [currentIdx, setCurrentIdx] = useState({
    images: 0,
    videos: 0,
    docs: 0,
  });

  /* -------- helpers ---------- */
  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "number" ? e.target.valueAsNumber || "" : e.target.value;
    setRoom((prev) => ({ ...prev, [field]: value }));
    setSubmitted(false);
  };

  const handleCheckbox = (field) => (e) => {
    setRoom((prev) => ({ ...prev, [field]: e.target.checked }));
    setSubmitted(false);
  };

  /* -------- media: add file ---------- */
  /* ✅ NEW: Verify images before adding */
  const verifyImages = async (files) => {
    const fileArray = Array.from(files);
    
    // Check total count
    if (images.length + fileArray.length > 3) {
      alert('Maximum 3 images allowed.');
      return;
    }

    setIsVerifying(true);
    setPendingImages(fileArray);
    setShowVerificationModal(true);

    // Initialize results with "verifying" status
    const initialResults = fileArray.map(file => ({
      file,
      status: 'verifying',
      isOriginal: null,
      reason: null,
      stolen_source: null
    }));
    setVerificationResults(initialResults);

    // Verify each image
    const results = await Promise.all(
      fileArray.map(async (file) => {
        try {
          console.log(`🔍 Verifying image: ${file.name}`);
          const result = await aiService.verifyImage(file);
          console.log(`✅ Verification result for ${file.name}:`, result);
          
          return {
            file,
            status: 'complete',
            isOriginal: result.isOriginal,
            reason: result.reason,
            stolen_check: result.stolen_check,
            ai_check: result.ai_check,
            stolen_source: result.stolen_source
          };
        } catch (error) {
          console.error(`❌ Failed to verify ${file.name}:`, error);
          
          // ✅ If verification service fails, allow the image (fail open)
          return {
            file,
            status: 'complete',
            isOriginal: true,
            reason: 'Verification service unavailable - image allowed',
            stolen_check: false,
            ai_check: false,
            stolen_source: null
          };
        }
      })
    );

    setVerificationResults(results);
    setIsVerifying(false);
  };

  /* ✅ UPDATE: Handle verification results */
  const handleVerificationProceed = () => {
    // Filter only original images
    const approvedImages = verificationResults
      .filter(r => r.isOriginal)
      .map(r => r.file);

    // Add to images state
    setImages(prev => [...prev, ...approvedImages]);

    // Close modal and reset
    setShowVerificationModal(false);
    setVerificationResults([]);
    setPendingImages([]);

    console.log(`✅ Added ${approvedImages.length} verified images`);
  };

  const handleVerificationCancel = () => {
    setShowVerificationModal(false);
    setVerificationResults([]);
    setPendingImages([]);
    console.log('🚫 Image verification cancelled');
  };

  /* ✅ UPDATE: addFiles to use verification */
  const addFiles = useCallback((type, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    if (type === "images") {
      // ✅ Verify images instead of adding directly
      verifyImages(files);
    } else if (type === "videos") {
      setVideos((prev) => {
        const merged = [...prev, ...files];
        if (merged.length > 2) {
          alert("Maximum 2 videos allowed.");
          return merged.slice(0, 2);
        }
        return merged;
      });
      setCurrentIdx((prev) => ({ ...prev, videos: 0 }));
    } else if (type === "docs") {
      setDocuments((prev) => {
        const merged = [...prev, ...files];
        if (merged.length > 3) {
          alert("Maximum 3 documents allowed.");
          return merged.slice(0, 3);
        }
        return merged;
      });
      setCurrentIdx((prev) => ({ ...prev, docs: 0 }));
    }
    setSubmitted(false);
  }, [images]); // ✅ Add images dependency

  const handleInputChange = (type) => (e) => {
    addFiles(type, e.target.files);
  };

  const handleDrop = (type) => (e) => {
    e.preventDefault();
    setDragOver(null);
    addFiles(type, e.dataTransfer.files);
  };

  const handleDragOver = (type) => (e) => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = (type) => (e) => {
    e.preventDefault();
    if (dragOver === type) setDragOver(null);
  };

  /* ---------- preview helpers ---------- */
  const getFilesByType = (type) => {
    if (type === "images") return images;
    if (type === "videos") return videos;
    return documents;
  };

  const setFilesByType = (type, updater) => {
    if (type === "images") setImages(updater);
    else if (type === "videos") setVideos(updater);
    else setDocuments(updater);
  };

  const stepPreview = (type, dir) => {
    setCurrentIdx((prev) => {
      const list = getFilesByType(type);
      const len = list.length;
      if (!len) return prev;

      const cur = prev[type] ?? 0;
      const next = (cur + dir + len) % len;
      return { ...prev, [type]: next };
    });
  };

  const removeFile = (type, index) => {
    setFilesByType(type, (prev) => {
      const next = prev.filter((_, i) => i !== index);

      setCurrentIdx((cur) => {
        const len = next.length;
        let newIdx = cur[type] ?? 0;
        if (newIdx >= len) newIdx = Math.max(len - 1, 0);
        return { ...cur, [type]: newIdx };
      });

      return next;
    });

    setSubmitted(false);
  };

  const renderPreviewLarge = (type) => {
    const list = getFilesByType(type);
    if (!list.length) return null;

    const idx = Math.min(currentIdx[type] ?? 0, list.length - 1);
    const file = list[idx];
    const url = URL.createObjectURL(file);
    const many = list.length > 1;

    return (
      <div className="mt-4 relative bg-black rounded-xl overflow-hidden min-h-[180px]" onClick={(e) => e.stopPropagation()}>
        {type === "images" ? (
          <img src={url} alt={file.name} className="w-full h-56 object-cover" />
        ) : type === "videos" ? (
          <video src={url} className="w-full h-56 object-cover" controls />
        ) : (
          <div className="flex items-center gap-3 p-6 bg-blue-50 min-h-[120px]">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-sm text-gray-900 max-w-[260px] truncate">{file.name}</span>
          </div>
        )}

        {/* Remove button */}
        <button
          type="button"
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            removeFile(type, idx);
          }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Navigation arrows */}
        {many && (
          <>
            <button
              type="button"
              className="absolute top-1/2 left-2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                stepPreview(type, -1);
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                stepPreview(type, 1);
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 right-3 px-2 py-1 rounded-full bg-black/70 text-white text-xs">
              {idx + 1}/{list.length}
            </div>
          </>
        )}
      </div>
    );
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append('title', room.title);
    formData.append('description', room.description || '');
    formData.append('rentPricePerMonth', Number(room.rentPricePerMonth) || 0);
    formData.append('minimumStayMonths', room.minimumStayMonths || 1);
    formData.append('address', room.address);
    
    if (room.latitude) formData.append('latitude', room.latitude);
    if (room.longitude) formData.append('longitude', room.longitude);
    
    formData.append('numberOfToilets', room.numberOfToilets || 1);
    formData.append('numberOfBedRooms', room.numberOfBedRooms || 1);
    formData.append('hasWindow', room.hasWindow);

    if (images.length > 0) {
      formData.append('thumbnail', images[0]);
    }

    images.forEach(file => {
      formData.append('images', file);
    });

    videos.forEach(file => {
      formData.append('videos', file);
    });

    documents.forEach(file => {
      formData.append('documents', file);
    });

    try {
      setSaving(true);
      setSubmitted(false);
      setError(null);

      console.log('Creating room with data...');
      
      const response = await landlordService.createRoom(formData);
      
      console.log('Room created successfully:', response);

      setCreatedRoom(response);
      setSaving(false);
      setSubmitted(true);

      setTimeout(() => {
        navigate(`/dashboard/landlord/room/${response.id}`);
      }, 3000);

    } catch (err) {
      console.error('Failed to create room:', err);
      setSaving(false);
      setError(err.response?.data?.message || 'Failed to create room. Please try again.');

      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const previewUrl = images[0] ? URL.createObjectURL(images[0]) : FALLBACK_IMG;

  /* ---------- RENDER ---------- */
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 to-white">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header Chip */}
        <div className="inline-block px-8 py-3 rounded-full bg-blue-600 text-white text-xl font-bold mb-6">
          Room Information
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-400 rounded-xl p-4 mb-6 text-red-900">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Saving overlay */}
        {saving && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">Creating your room…</p>
              <p className="text-sm text-gray-600">Please wait while we upload files and save your room.</p>
            </div>
          </div>
        )}

        {/* SUCCESS VIEW */}
        {submitted && createdRoom ? (
          <>
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              numberOfPieces={600}
              gravity={0.2}
              recycle={false}
            />

            <div className="max-w-2xl mx-auto mt-8 bg-white rounded-3xl p-12 shadow-2xl text-center animate-[slideUp_0.6s_ease-out]">
              {/* Animated Checkmark */}
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <svg className="w-20 h-20" viewBox="0 0 52 52">
                  <circle
                    className="stroke-green-500 fill-none animate-[stroke_0.6s_ease]"
                    style={{
                      strokeDasharray: '166',
                      strokeDashoffset: '0',
                      strokeWidth: '2.5'
                    }}
                    cx="26"
                    cy="26"
                    r="25"
                  />
                  <path
                    className="stroke-green-500 fill-none animate-[stroke_0.3s_0.6s_ease_forwards]"
                    style={{
                      strokeDasharray: '48',
                      strokeDashoffset: '0',
                      strokeWidth: '2.5'
                    }}
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                  />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">Room Created Successfully!</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Your room <strong>"{createdRoom.title}"</strong> has been created. <br />
                Redirecting to room details...
              </p>

              {/* Preview Card */}
              <div className="max-w-md mx-auto mb-8 bg-gray-50 rounded-xl overflow-hidden shadow-lg">
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={previewUrl}
                    alt={createdRoom.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
                    PUBLISHED
                  </div>
                </div>
                <div className="p-5 text-left">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{createdRoom.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{createdRoom.address}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-bold">{formatVnd(createdRoom.rentPricePerMonth)}</span>
                    <span className="text-xs text-gray-500">{createdRoom.minimumStayMonths}+ months</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition transform hover:scale-105"
                onClick={() => {
                  setSubmitted(false);
                  setCreatedRoom(null);
                  setRoom({
                    title: "",
                    description: "",
                    rentPricePerMonth: "",
                    minimumStayMonths: 1,
                    address: "",
                    latitude: "",
                    longitude: "",
                    numberOfToilets: 1,
                    numberOfBedRooms: 1,
                    hasWindow: true,
                  });
                  setImages([]);
                  setVideos([]);
                  setDocuments([]);
                  window.scrollTo(0, 0);
                }}
              >
                Upload Another Room
              </button>
            </div>
          </>
        ) : (
          /* FORM */
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1.1fr] gap-8 items-start">
            {/* LEFT: Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-lg space-y-6">
              {/* Basic details */}
              <section className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic details</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={room.title}
                      onChange={handleChange("title")}
                      placeholder="Cozy 2BR Apartment"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <input
                      type="text"
                      value={room.address}
                      onChange={handleChange("address")}
                      placeholder="123 Main Street, District 7, HCMC"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={room.description}
                      onChange={handleChange("description")}
                      placeholder="Short description of the room, surroundings, etc."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
                    />
                  </div>
                </div>
              </section>

              {/* Pricing & stay */}
              <section className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & stay</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rent / month (VND) *</label>
                    <input
                      type="number"
                      min="0"
                      value={room.rentPricePerMonth}
                      onChange={handleChange("rentPricePerMonth")}
                      placeholder="5000000"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum stay (months) *</label>
                    <input
                      type="number"
                      min="1"
                      value={room.minimumStayMonths}
                      onChange={handleChange("minimumStayMonths")}
                      placeholder="6"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="text-sm font-medium text-gray-700">Has window</label>
                  <label className="relative inline-block w-12 h-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={room.hasWindow}
                      onChange={handleCheckbox("hasWindow")}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow"></div>
                  </label>
                </div>
              </section>

              {/* Layout & location */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Layout & location</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms *</label>
                    <input
                      type="number"
                      min="1"
                      value={room.numberOfBedRooms}
                      onChange={handleChange("numberOfBedRooms")}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Toilets *</label>
                    <input
                      type="number"
                      min="1"
                      value={room.numberOfToilets}
                      onChange={handleChange("numberOfToilets")}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={room.latitude}
                      onChange={handleChange("latitude")}
                      placeholder="10.7769"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={room.longitude}
                      onChange={handleChange("longitude")}
                      placeholder="106.7009"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </section>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Create Room
              </button>
            </form>

            {/* RIGHT: Media Drop Zones */}
            <div className="space-y-6">
              {/* IMAGES */}
              <div
                className={`group bg-white rounded-2xl p-5 border-2 border-dashed cursor-pointer shadow-md transition-all ${
                  dragOver === "images"
                    ? "border-blue-600 bg-blue-50 shadow-lg"
                    : "border-blue-200 hover:border-blue-400"
                }`}
                onDragOver={handleDragOver("images")}
                onDragLeave={handleDragLeave("images")}
                onDrop={handleDrop("images")}
                onClick={() => imgInputRef.current?.click()}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Images (0–3)
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, GIF, WEBP · max 10MB</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">Drag & drop images here, or click to browse.</p>
                <p className="text-xs text-gray-500">
                  {images.length ? `Selected: ${images.length} file(s)` : "No images yet."}
                </p>

                {renderPreviewLarge("images")}

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {images.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs hover:bg-blue-200 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile("images", i);
                        }}
                      >
                        <span className="max-w-[120px] truncate">{f.name}</span>
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}

                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleInputChange("images")}
                />
              </div>

              {/* VIDEOS */}
              <div
                className={`group bg-white rounded-2xl p-5 border-2 border-dashed cursor-pointer shadow-md transition-all ${
                  dragOver === "videos"
                    ? "border-purple-600 bg-purple-50 shadow-lg"
                    : "border-purple-200 hover:border-purple-400"
                }`}
                onDragOver={handleDragOver("videos")}
                onDragLeave={handleDragLeave("videos")}
                onDrop={handleDrop("videos")}
                onClick={() => vidInputRef.current?.click()}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-base font-semibold text-purple-900 flex items-center gap-2">
                      <VideoIcon className="w-5 h-5" />
                      Videos (0–2)
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">MP4, MOV, WEBM · max 100MB</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">Drag & drop videos here, or click to browse.</p>
                <p className="text-xs text-gray-500">
                  {videos.length ? `Selected: ${videos.length} file(s)` : "No videos yet."}
                </p>

                {renderPreviewLarge("videos")}

                {videos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {videos.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-xs hover:bg-purple-200 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile("videos", i);
                        }}
                      >
                        <span className="max-w-[120px] truncate">{f.name}</span>
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}

                <input
                  ref={vidInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  hidden
                  onChange={handleInputChange("videos")}
                />
              </div>

              {/* DOCUMENTS */}
              <div
                className={`group bg-white rounded-2xl p-5 border-2 border-dashed cursor-pointer shadow-md transition-all ${
                  dragOver === "docs"
                    ? "border-teal-600 bg-teal-50 shadow-lg"
                    : "border-teal-200 hover:border-teal-400"
                }`}
                onDragOver={handleDragOver("docs")}
                onDragLeave={handleDragLeave("docs")}
                onDrop={handleDrop("docs")}
                onClick={() => docInputRef.current?.click()}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-base font-semibold text-teal-900 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documents (0–3)
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">PDF, DOCX, XLSX, CSV · max 20MB</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">Drag & drop documents here, or click to browse.</p>
                <p className="text-xs text-gray-500">
                  {documents.length ? `Selected: ${documents.length} file(s)` : "No documents yet."}
                </p>

                {renderPreviewLarge("docs")}

                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {documents.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        className="flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-900 rounded-full text-xs hover:bg-teal-200 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile("docs", i);
                        }}
                      >
                        <span className="max-w-[120px] truncate">{f.name}</span>
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}

                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  multiple
                  hidden
                  onChange={handleInputChange("docs")}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ✅ ADD: Verification Modal */}
      <ImageVerificationModal
        isOpen={showVerificationModal}
        onClose={handleVerificationCancel}
        verificationResults={verificationResults}
        onProceed={handleVerificationProceed}
      />
    </div>
  );
}