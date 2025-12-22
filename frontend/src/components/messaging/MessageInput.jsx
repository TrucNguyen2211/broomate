// FE/src/components/messaging/MessageInput.jsx

import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Image, Video, FileText, Loader } from 'lucide-react';
import { validateFile, formatFileSize, detectFileType, resizeImage } from '../../utils/fileValidation';

/**
 * Message input with file upload support
 */
function MessageInput({ 
  onSendMessage, 
  isSending = false,
  compact = false,
  placeholder = "Type a message..."
}) {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    // Auto-resize large images
    let processedFile = file;
    const fileType = detectFileType(file);
    
    if (fileType === 'images' && file.size > 2 * 1024 * 1024) {
      try {
        setIsResizing(true);
        processedFile = await resizeImage(file, 1920, 1080, 0.85);
        console.log(`✅ Image resized: ${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)}`);
      } catch (error) {
        console.warn('⚠️ Failed to resize image, using original:', error);
        processedFile = file;
      } finally {
        setIsResizing(false);
      }
    }

    setSelectedFile(processedFile);

    // Generate preview
    if (fileType === 'images') {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(processedFile);
    } else if (fileType === 'videos') {
      const videoUrl = URL.createObjectURL(processedFile);
      setFilePreview(videoUrl);
    } else {
      setFilePreview(null);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open file picker
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // Send message with file
  const handleSend = async () => {
    const hasContent = inputMessage.trim();
    const hasFile = selectedFile !== null;

    if (!hasContent && !hasFile) return;
    if (isSending || isResizing) return;

    try {
      await onSendMessage(inputMessage.trim() || '', selectedFile);
      
      setInputMessage('');
      handleRemoveFile();
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setUploadError('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get file type icon
  const getFileIcon = () => {
    if (!selectedFile) return null;
    const fileType = detectFileType(selectedFile);
    
    if (fileType === 'images') return <Image className="w-4 h-4" />;
    if (fileType === 'videos') return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${compact ? 'p-3' : 'p-4'}`}>
      {/* FILE PREVIEW */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-start gap-3">
            {/* Preview */}
            {filePreview ? (
              <div className="flex-shrink-0">
                {detectFileType(selectedFile) === 'images' ? (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <video 
                    src={filePreview} 
                    className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-600"
                    muted
                  />
                )}
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-gray-500 dark:text-gray-400">
                {getFileIcon()}
              </div>
            )}

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(selectedFile.size)}
              </p>
              {isResizing && (
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                  ✨ Optimizing image...
                </p>
              )}
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemoveFile}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition"
              title="Remove file"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {uploadError && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
          ⚠️ {uploadError}
        </div>
      )}

      {/* INPUT AREA */}
      <div className="flex items-end gap-2">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Attach Button */}
        <button
          onClick={handleAttachClick}
          disabled={isSending || isResizing}
          className={`p-2 rounded-full transition ${
            selectedFile
              ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
              : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Attach file (image, video, or document)"
        >
          <Paperclip className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        </button>

        {/* Text Input */}
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={selectedFile ? 'Add a caption (optional)' : placeholder}
          rows="1"
          disabled={isSending || isResizing}
          className={`flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-full focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed ${
            compact ? 'text-sm' : ''
          }`}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!inputMessage.trim() && !selectedFile) || isSending || isResizing}
          className={`${compact ? 'p-2' : 'p-3'} bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full hover:from-teal-600 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Send message"
        >
          {isSending || isResizing ? (
            <Loader className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
          ) : (
            <Send className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          )}
        </button>
      </div>

      {/* HELPER TEXT */}
      {!compact && (
        <div className="mt-2 px-4 space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: Press Enter to send, Shift+Enter for new line
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            📎 Allowed: Images (10MB), Videos (50MB), Documents (20MB)
          </p>
        </div>
      )}
    </div>
  );
}

export default MessageInput;