import React, { useState } from 'react';
import { Download, X, FileText, ExternalLink } from 'lucide-react';

/**
 * Reusable message bubble component with smart media detection
 */
function MessageBubble({ 
  message, 
  isMyMessage, 
  senderName,
  senderAvatar,
  compact = false 
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // ✅ Helper functions to detect media types
  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url) || 
           url.includes('supabase') && url.includes('image');
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  };

  const isDocumentUrl = (url) => {
    if (!url) return false;
    return /\.(pdf|doc|docx|xls|xlsx|csv)(\?.*)?$/i.test(url);
  };

  const extractFilename = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      const filename = parts[parts.length - 1];
      // Remove query parameters and decode
      return decodeURIComponent(filename.split('?')[0]) || 'File';
    } catch {
      return 'File';
    }
  };

  // ✅ Check if content itself is a media URL
  const contentIsMediaUrl = message.content && (
    isImageUrl(message.content) || 
    isVideoUrl(message.content) || 
    isDocumentUrl(message.content)
  );

  // ✅ Combine media URLs
  const mediaUrls = message.mediaUrls || [];
  const allMediaUrls = contentIsMediaUrl 
    ? [message.content, ...mediaUrls]
    : mediaUrls;

  // ✅ Filter media URLs from text content
  let textContent = message.content || '';
  if (contentIsMediaUrl) {
    textContent = ''; // Don't show URL as text if it's media
  } else if (allMediaUrls.length > 0) {
    // Remove any media URLs from text
    allMediaUrls.forEach(url => {
      textContent = textContent.replace(url, '').trim();
    });
  }

  const openLightbox = (imageUrl) => {
    setSelectedImage(imageUrl);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImage(null);
  };

  return (
    <>
      <div className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : ''} ${compact ? 'mb-3' : 'mb-4'}`}>
        {/* Avatar */}
        <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold flex-shrink-0 ${compact ? 'text-xs' : 'text-sm'}`}>
          {senderAvatar || (isMyMessage ? 'ME' : senderName?.charAt(0) || '?')}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} ${compact ? 'max-w-[70%]' : 'max-w-md'}`}>
          {/* Sender name (only for received messages) */}
          {!isMyMessage && !compact && (
            <p className="text-xs font-semibold text-gray-700 mb-1 px-2">{senderName}</p>
          )}

          {/* Message bubble */}
          <div className={`px-4 py-2 rounded-2xl ${
            isMyMessage 
              ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white' 
              : 'bg-white border border-gray-200 text-gray-900'
          }`}>
            {/* ✅ IMAGES - Render before text */}
            {allMediaUrls.some(url => isImageUrl(url)) && (
              <div className="mb-2 space-y-2">
                {allMediaUrls
                  .filter(url => isImageUrl(url))
                  .map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition shadow-sm"
                        style={{ maxHeight: '300px', width: 'auto' }}
                        onClick={() => openLightbox(imageUrl)}
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      {/* Fallback link */}
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden items-center gap-2 text-sm underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View image
                      </a>
                    </div>
                  ))}
              </div>
            )}

            {/* ✅ VIDEOS */}
            {allMediaUrls.some(url => isVideoUrl(url)) && (
              <div className="mb-2 space-y-2">
                {allMediaUrls
                  .filter(url => isVideoUrl(url))
                  .map((videoUrl, index) => (
                    <video
                      key={index}
                      src={videoUrl}
                      controls
                      className="max-w-full rounded-lg shadow-sm"
                      style={{ maxHeight: '300px' }}
                    >
                      Your browser does not support video playback.
                    </video>
                  ))}
              </div>
            )}

            {/* ✅ DOCUMENTS */}
            {allMediaUrls.some(url => isDocumentUrl(url)) && (
              <div className="mb-2 space-y-2">
                {allMediaUrls
                  .filter(url => isDocumentUrl(url))
                  .map((docUrl, index) => (
                    <a
                      key={index}
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        isMyMessage
                          ? 'bg-white/20 hover:bg-white/30'
                          : 'bg-gray-100 hover:bg-gray-200'
                      } transition`}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate flex-1">
                        {extractFilename(docUrl)}
                      </span>
                      <Download className="w-4 h-4 flex-shrink-0" />
                    </a>
                  ))}
              </div>
            )}

            {/* ✅ TEXT CONTENT - Only show if not empty */}
            {textContent && (
              <p 
                className={`whitespace-pre-line ${compact ? 'text-sm' : 'text-sm'}`}
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
              >
                {textContent}
              </p>
            )}
          </div>

          {/* ✅ Timestamp */}
          <p className="text-xs text-gray-500 mt-1 px-2">
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>

      {/* ✅ LIGHTBOX for full-size images */}
      {lightboxOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
            onClick={closeLightbox}
          >
            <X className="w-8 h-8" />
          </button>

          {/* Image */}
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Download button */}
          <a
            href={selectedImage}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-5 h-5" />
            Download
          </a>
        </div>
      )}
    </>
  );
}

export default MessageBubble;