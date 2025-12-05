package org.example.Broomate.service;

import com.google.cloud.Timestamp;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.Broomate.dto.request.landlord.CreateRoomRequestJSON;
import org.example.Broomate.dto.request.landlord.UpdateLandlordProfileRequest;
import org.example.Broomate.dto.request.landlord.UpdateRoomWithBothInfoAndMediaRequest;
import org.example.Broomate.dto.response.landlord.LandlordProfileResponse;
import org.example.Broomate.dto.response.allAuthUser.RoomDetailResponse;
import org.example.Broomate.model.Landlord;
import org.example.Broomate.model.Room;
import org.example.Broomate.repository.LandlordRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LandlordService {

    private final LandlordRepository landlordRepository;
    private final FileStorageService fileStorageService;

    // ========================================
    // SCENARIO 1: CREATE ROOM (WITH ATOMICITY)(WITH PARALLEL UPLOADS)
    // ========================================
    /**
     * Create new room with file uploads
     * If any step fails, rollback uploaded files
     */

    public RoomDetailResponse createRoom(
            String landlordId,
            CreateRoomRequestJSON request,
            MultipartFile thumbnail,
            List<MultipartFile> images,
            List<MultipartFile> videos,
            List<MultipartFile> documents) throws IOException {

        log.info("Creating room for landlord: {}", landlordId);

        List<String> uploadedUrls = new ArrayList<>();

        try {
            // 1. Verify landlord exists
            Landlord landlord = landlordRepository.findById(landlordId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Landlord not found with ID: " + landlordId));

            // 2. Upload ALL file types in PARALLEL
            log.info("Uploading files to Supabase Storage in parallel...");
            long startTime = System.currentTimeMillis();

            CompletableFuture<String> thumbnailFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    if (thumbnail != null && !thumbnail.isEmpty()) {
                        return fileStorageService.uploadFile(thumbnail, "thumbnails");
                    }
                    return null;
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload thumbnail", e);
                }
            });

            CompletableFuture<List<String>> imagesFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    return fileStorageService.uploadFiles(images, "images");
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload images", e);
                }
            });

            CompletableFuture<List<String>> videosFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    return fileStorageService.uploadFiles(videos, "videos");
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload videos", e);
                }
            });

            CompletableFuture<List<String>> documentsFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    return fileStorageService.uploadFiles(documents, "documents");
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload documents", e);
                }
            });

            // Wait for all uploads to complete
            CompletableFuture.allOf(thumbnailFuture, imagesFuture, videosFuture, documentsFuture).join();

            // Get results
            String thumbnailUrl = thumbnailFuture.join();
            List<String> imageUrls = imagesFuture.join();
            List<String> videoUrls = videosFuture.join();
            List<String> documentUrls = documentsFuture.join();

            // Track all uploaded URLs for rollback
            if (thumbnailUrl != null)
                uploadedUrls.add(thumbnailUrl);
            uploadedUrls.addAll(imageUrls);
            uploadedUrls.addAll(videoUrls);
            uploadedUrls.addAll(documentUrls);

            long uploadTime = System.currentTimeMillis() - startTime;
            log.info("All files uploaded in {} ms (thumbnail: {}, images: {}, videos: {}, documents: {})",
                    uploadTime, thumbnailUrl != null ? 1 : 0, imageUrls.size(), videoUrls.size(), documentUrls.size());

            // 3. Create new room
            Room room = Room.builder()
                    .id(UUID.randomUUID().toString())
                    .landlordId(landlordId)
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .thumbnailUrl(thumbnailUrl)
                    .imageUrls(imageUrls)
                    .videoUrls(videoUrls)
                    .documentUrls(documentUrls)
                    .rentPricePerMonth(request.getRentPricePerMonth())
                    .minimumStayMonths(request.getMinimumStayMonths())
                    .address(request.getAddress())
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .numberOfToilets(request.getNumberOfToilets())
                    .numberOfBedRooms(request.getNumberOfBedRooms())
                    .hasWindow(request.isHasWindow())
                    .status(Room.RoomStatus.PUBLISHED)
                    .createdAt(Timestamp.now())
                    .updatedAt(Timestamp.now())
                    .build();

            // 4. Save to Firestore
            Room savedRoom = landlordRepository.saveRoom(room);

            log.info("Room created successfully with ID: {}", savedRoom.getId());

            return RoomDetailResponse.fromRoom(savedRoom);

        } catch (Exception e) {
            // ROLLBACK: Delete all uploaded files in parallel
            log.error("Room creation failed, rolling back uploaded files", e);
            if (!uploadedUrls.isEmpty()) {
                log.info("Deleting {} uploaded files in parallel...", uploadedUrls.size());
                fileStorageService.deleteFiles(uploadedUrls);
            }
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to create room: " + e.getMessage());
        }
    }

    // ========================================
    // UPDATE ROOM (UNIFIED - INFO + MEDIA)
    // ========================================
    public RoomDetailResponse updateRoomBothInfoAndMediaFile(
            String landlordId,
            String roomId,
            UpdateRoomWithBothInfoAndMediaRequest request,
            MultipartFile thumbnail,
            List<MultipartFile> images,
            List<MultipartFile> videos,
            List<MultipartFile> documents) throws IOException {

        log.info("Updating room {} for landlord {}", roomId, landlordId);

        List<String> newlyUploadedUrls = new ArrayList<>();
        List<String> filesToDelete = new ArrayList<>();

        try {
            // 1. Get existing room
            Room room = landlordRepository.findRoomById(roomId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Room not found with ID: " + roomId));

            // 2. Verify ownership
            if (!room.getLandlordId().equals(landlordId)) {
                throw new AccessDeniedException("You don't have permission to update this room");
            }

            // 3. Update basic info
            room.setTitle(request.getTitle());
            room.setDescription(request.getDescription());
            room.setRentPricePerMonth(request.getRentPricePerMonth());
            room.setMinimumStayMonths(request.getMinimumStayMonths());
            room.setAddress(request.getAddress());
            room.setLatitude(request.getLatitude());
            room.setLongitude(request.getLongitude());
            room.setNumberOfToilets(request.getNumberOfToilets());
            room.setNumberOfBedRooms(request.getNumberOfBedRooms());
            room.setHasWindow(request.getHasWindow());
            if (request.getStatus() != null) {
                room.setStatus(request.getStatus());
            }

            // 4. Handle media updates in PARALLEL
            long startTime = System.currentTimeMillis();

            // Prepare futures for all operations
            CompletableFuture<String> thumbnailFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    if (request.getReplaceThumbnail() != null && request.getReplaceThumbnail()) {
                        if (room.getThumbnailUrl() != null) {
                            filesToDelete.add(room.getThumbnailUrl());
                        }
                        if (thumbnail != null && !thumbnail.isEmpty()) {
                            return fileStorageService.uploadFile(thumbnail, "thumbnails");
                        }
                        return null;
                    } else if (thumbnail != null && !thumbnail.isEmpty()) {
                        if (room.getThumbnailUrl() != null) {
                            filesToDelete.add(room.getThumbnailUrl());
                        }
                        return fileStorageService.uploadFile(thumbnail, "thumbnails");
                    }
                    return room.getThumbnailUrl();
                } catch (IOException e) {
                    throw new RuntimeException("Failed to process thumbnail", e);
                }
            });

            CompletableFuture<List<String>> imagesFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    List<String> currentImages = new ArrayList<>(
                            room.getImageUrls() != null ? room.getImageUrls() : new ArrayList<>());

                    // Remove specified images
                    if (request.getImagesToRemove() != null && !request.getImagesToRemove().isEmpty()) {
                        filesToDelete.addAll(request.getImagesToRemove());
                        currentImages.removeAll(request.getImagesToRemove());
                    }

                    // Add new images
                    if (images != null && !images.isEmpty()) {
                        List<String> newImageUrls = fileStorageService.uploadFiles(images, "images");
                        currentImages.addAll(newImageUrls);
                    }

                    return currentImages;
                } catch (IOException e) {
                    throw new RuntimeException("Failed to process images", e);
                }
            });

            CompletableFuture<List<String>> videosFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    List<String> currentVideos = new ArrayList<>(
                            room.getVideoUrls() != null ? room.getVideoUrls() : new ArrayList<>());

                    if (request.getVideosToRemove() != null && !request.getVideosToRemove().isEmpty()) {
                        filesToDelete.addAll(request.getVideosToRemove());
                        currentVideos.removeAll(request.getVideosToRemove());
                    }

                    if (videos != null && !videos.isEmpty()) {
                        List<String> newVideoUrls = fileStorageService.uploadFiles(videos, "videos");
                        currentVideos.addAll(newVideoUrls);
                    }

                    return currentVideos;
                } catch (IOException e) {
                    throw new RuntimeException("Failed to process videos", e);
                }
            });

            CompletableFuture<List<String>> documentsFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    List<String> currentDocuments = new ArrayList<>(
                            room.getDocumentUrls() != null ? room.getDocumentUrls() : new ArrayList<>());

                    if (request.getDocumentsToRemove() != null && !request.getDocumentsToRemove().isEmpty()) {
                        filesToDelete.addAll(request.getDocumentsToRemove());
                        currentDocuments.removeAll(request.getDocumentsToRemove());
                    }

                    if (documents != null && !documents.isEmpty()) {
                        List<String> newDocumentUrls = fileStorageService.uploadFiles(documents, "documents");
                        currentDocuments.addAll(newDocumentUrls);
                    }

                    return currentDocuments;
                } catch (IOException e) {
                    throw new RuntimeException("Failed to process documents", e);
                }
            });

            // Wait for all operations to complete
            CompletableFuture.allOf(thumbnailFuture, imagesFuture, videosFuture, documentsFuture).join();

            // Get results and update room
            room.setThumbnailUrl(thumbnailFuture.join());
            room.setImageUrls(imagesFuture.join());
            room.setVideoUrls(videosFuture.join());
            room.setDocumentUrls(documentsFuture.join());

            long operationTime = System.currentTimeMillis() - startTime;
            log.info("All media operations completed in {} ms", operationTime);

            // 5. Delete old files in parallel
            if (!filesToDelete.isEmpty()) {
                log.info("Deleting {} old files in parallel", filesToDelete.size());
                fileStorageService.deleteFiles(filesToDelete);
            }

            room.setUpdatedAt(Timestamp.now());

            // 6. Save updated room
            Room updatedRoom = landlordRepository.updateRoom(roomId, room);

            log.info("Room updated successfully: {}", roomId);

            return RoomDetailResponse.fromRoom(updatedRoom);

        } catch (Exception e) {
            // Rollback newly uploaded files
            log.error("Room update failed, rolling back newly uploaded files", e);
            if (!newlyUploadedUrls.isEmpty()) {
                fileStorageService.deleteFiles(newlyUploadedUrls);
            }
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to update room: " + e.getMessage());
        }
    }

    // ========================================
    // UPDATE LANDLORD PROFILE (WITH AVATAR)
    // ========================================
    public LandlordProfileResponse updateProfile(
            String landlordId,
            UpdateLandlordProfileRequest request,
            MultipartFile avatar) throws IOException {

        log.info("Updating landlord profile for ID: {}", landlordId);

        Landlord landlord = landlordRepository.findById(landlordId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Landlord not found with ID: " + landlordId));

        String oldAvatarUrl = landlord.getAvatarUrl();
        String newAvatarUrl = oldAvatarUrl;

        try {
            // Handle avatar update
            if (request.getRemoveAvatar() != null && request.getRemoveAvatar()) {
                // User wants to remove avatar
                if (oldAvatarUrl != null) {
                    fileStorageService.deleteFile(oldAvatarUrl);
                    log.info("Removed avatar for landlord {}", landlordId);
                }
                newAvatarUrl = null;
            } else if (avatar != null && !avatar.isEmpty()) {
                // User is uploading a new avatar
                // Delete old avatar if exists
                if (oldAvatarUrl != null) {
                    fileStorageService.deleteFile(oldAvatarUrl);
                    log.info("Deleted old avatar for landlord {}", landlordId);
                }

                // Upload new avatar
                newAvatarUrl = fileStorageService.uploadFile(avatar, "avatars");
                log.info("Uploaded new avatar for landlord {}: {}", landlordId, newAvatarUrl);
            }

            // Update profile info
            landlord.setName(request.getName());
            landlord.setPhone(request.getPhone());
            landlord.setAvatarUrl(newAvatarUrl);
            landlord.setDescription(request.getDescription());
            landlord.setUpdatedAt(Timestamp.now());

            Landlord updatedLandlord = landlordRepository.update(landlordId, landlord);

            log.info("Landlord profile updated successfully: {}", landlordId);

            return LandlordProfileResponse.fromLandlord(updatedLandlord);

        } catch (Exception e) {
            log.error("Failed to update landlord profile: {}", landlordId, e);

            // Rollback: If we uploaded a new avatar but profile update failed, delete it
            if (newAvatarUrl != null && !newAvatarUrl.equals(oldAvatarUrl)) {
                fileStorageService.deleteFile(newAvatarUrl);
                log.info("Rolled back new avatar upload due to profile update failure");
            }

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to update profile: " + e.getMessage());
        }
    }

    // ========================================
    // GET LANDLORD PROFILE
    // ========================================
    public LandlordProfileResponse getProfile(String landlordId) {
        log.info("Getting landlord profile for ID: {}", landlordId);

        Landlord landlord = landlordRepository.findById(landlordId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Landlord not found with ID: " + landlordId));

        return LandlordProfileResponse.fromLandlord(landlord);
    }

    /**
     * Get all rooms owned by a specific landlord
     * 
     * @param landlordId - The landlord's user ID
     * @return List of room detail responses
     */
    public List<RoomDetailResponse> getMyRooms(String landlordId) {
        // Fetch all rooms where landlordId matches
        List<Room> rooms = landlordRepository.findRoomsByLandlordUserId(landlordId);

        // Convert to response DTOs using the existing fromRoom() method
        return rooms.stream()
                .map(RoomDetailResponse::fromRoom) // ✅ Simplest approach
                .collect(Collectors.toList());
    }

    /**
     * Helper method to convert Room entity to RoomDetailResponse
     * (You might already have this method - if so, just use it)
     */
    private RoomDetailResponse convertRoomToDetailResponse(Room room) {
        return RoomDetailResponse.fromRoom(room); // ✅ Use the existing static method
    }
}