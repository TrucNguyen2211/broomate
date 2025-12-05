// src/utils/fileValidation.js

/**
 * File validation rules matching backend FileValidationService.java
 */

export const FILE_RULES = {
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'],
    maxSize: 10 * 1024 * 1024, // 10 MB
    maxCount: 3,
    accept: 'image/*',
  },
  videos: {
    extensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
    maxSize: 50 * 1024 * 1024, // 50 MB
    maxCount: 2,
    accept: 'video/*',
  },
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
    ],
    maxSize: 20 * 1024 * 1024, // 20 MB
    maxCount: 3,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt',
  },
};

/**
 * Detect file type from extension or MIME type
 */
export const detectFileType = (file) => {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  // Check images
  if (
    FILE_RULES.images.mimeTypes.includes(mimeType) ||
    FILE_RULES.images.extensions.some((ext) => fileName.endsWith(ext))
  ) {
    return 'images';
  }

  // Check videos
  if (
    FILE_RULES.videos.mimeTypes.includes(mimeType) ||
    FILE_RULES.videos.extensions.some((ext) => fileName.endsWith(ext))
  ) {
    return 'videos';
  }

  // Check documents
  if (
    FILE_RULES.documents.mimeTypes.includes(mimeType) ||
    FILE_RULES.documents.extensions.some((ext) => fileName.endsWith(ext))
  ) {
    return 'documents';
  }

  return null; // Unknown type
};

/**
 * Validate a single file
 * Returns { valid: boolean, error: string }
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Detect file type
  const fileType = detectFileType(file);
  if (!fileType) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please upload an image, video, or document.' 
    };
  }

  const rules = FILE_RULES[fileType];

  // Check file size
  if (file.size > rules.maxSize) {
    const maxSizeMB = rules.maxSize / (1024 * 1024);
    return { 
      valid: false, 
      error: `File size exceeds ${maxSizeMB}MB limit for ${fileType}` 
    };
  }

  // Check extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = rules.extensions.some((ext) => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return { 
      valid: false, 
      error: `Invalid file extension. Allowed: ${rules.extensions.join(', ')}` 
    };
  }

  return { valid: true, error: null };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Resize image if too large (optional - for optimization)
 */
export const resizeImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.9) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with same name and type
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};