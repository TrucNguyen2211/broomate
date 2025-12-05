package org.example.Broomate.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
public class FileValidationService {

    // Image validation
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList(
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"
    );

    private static final List<String> ALLOWED_IMAGE_MIME_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"
    );

    // Video validation
    private static final List<String> ALLOWED_VIDEO_EXTENSIONS = Arrays.asList(
            ".mp4", ".mov", ".avi", ".mkv", ".webm"
    );

    private static final List<String> ALLOWED_VIDEO_MIME_TYPES = Arrays.asList(
            "video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"
    );

    // Document validation
    private static final List<String> ALLOWED_DOCUMENT_EXTENSIONS = Arrays.asList(
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt"
    );

    private static final List<String> ALLOWED_DOCUMENT_MIME_TYPES = Arrays.asList(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "text/plain"
    );

    // File size limits (in bytes)
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;      // 10 MB
    private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024;     // 100 MB
    private static final long MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;   // 20 MB

    /**
     * Validate image file
     */
    public void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        String filename = file.getOriginalFilename();
        String contentType = file.getContentType();
        long fileSize = file.getSize();

        // Check file size
        if (fileSize > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException(
                    "Image file size exceeds maximum allowed size of " + (MAX_IMAGE_SIZE / 1024 / 1024) + " MB"
            );
        }

        // Check extension
        String extension = getFileExtension(filename).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Invalid image file type. Allowed types: " + String.join(", ", ALLOWED_IMAGE_EXTENSIONS)
            );
        }

        // Check MIME type
        if (contentType != null && !ALLOWED_IMAGE_MIME_TYPES.contains(contentType)) {
            log.warn("Unexpected MIME type for image: {}", contentType);
        }

        log.info("Image validation passed: {} ({} KB)", filename, fileSize / 1024);
    }

    /**
     * Validate video file
     */
    public void validateVideo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Video file is required");
        }

        String filename = file.getOriginalFilename();
        String contentType = file.getContentType();
        long fileSize = file.getSize();

        // Check file size
        if (fileSize > MAX_VIDEO_SIZE) {
            throw new IllegalArgumentException(
                    "Video file size exceeds maximum allowed size of " + (MAX_VIDEO_SIZE / 1024 / 1024) + " MB"
            );
        }

        // Check extension
        String extension = getFileExtension(filename).toLowerCase();
        if (!ALLOWED_VIDEO_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Invalid video file type. Allowed types: " + String.join(", ", ALLOWED_VIDEO_EXTENSIONS)
            );
        }

        // Check MIME type
        if (contentType != null && !ALLOWED_VIDEO_MIME_TYPES.contains(contentType)) {
            log.warn("Unexpected MIME type for video: {}", contentType);
        }

        log.info("Video validation passed: {} ({} MB)", filename, fileSize / 1024 / 1024);
    }

    /**
     * Validate document file
     */
    public void validateDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Document file is required");
        }

        String filename = file.getOriginalFilename();
        String contentType = file.getContentType();
        long fileSize = file.getSize();

        // Check file size
        if (fileSize > MAX_DOCUMENT_SIZE) {
            throw new IllegalArgumentException(
                    "Document file size exceeds maximum allowed size of " + (MAX_DOCUMENT_SIZE / 1024 / 1024) + " MB"
            );
        }

        // Check extension
        String extension = getFileExtension(filename).toLowerCase();
        if (!ALLOWED_DOCUMENT_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Invalid document file type. Allowed types: " + String.join(", ", ALLOWED_DOCUMENT_EXTENSIONS)
            );
        }

        // Check MIME type
        if (contentType != null && !ALLOWED_DOCUMENT_MIME_TYPES.contains(contentType)) {
            log.warn("Unexpected MIME type for document: {}", contentType);
        }

        log.info("Document validation passed: {} ({} KB)", filename, fileSize / 1024);
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Validate multiple images
     */
    public void validateImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                validateImage(file);
            }
        }
    }

    /**
     * Validate multiple videos
     */
    public void validateVideos(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                validateVideo(file);
            }
        }
    }

    /**
     * Validate multiple documents
     */
    public void validateDocuments(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                validateDocument(file);
            }
        }
    }
}