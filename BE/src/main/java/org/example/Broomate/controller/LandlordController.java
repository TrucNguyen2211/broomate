package org.example.Broomate.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.Broomate.config.CustomUserDetails;
import org.example.Broomate.dto.request.landlord.*;
import org.example.Broomate.dto.response.ErrorResponse;
import org.example.Broomate.dto.response.landlord.LandlordProfileResponse;
import org.example.Broomate.dto.response.allAuthUser.RoomDetailResponse;
import org.example.Broomate.service.LandlordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/landlord")
@Tag(name = "Landlord", description = "APIs available only for landlords")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class LandlordController {

        private final LandlordService landlordService;

        // SCENARIO 1: CREATE ROOM WITH MEDIA
        // ========================================
        @Operation(summary = "Create a new room with file uploads", description = "Create a new room listing with all details and media files (ATOMIC)")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "Room created successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = RoomDetailResponse.class))),
                        @ApiResponse(responseCode = "400", description = "Invalid request body", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "403", description = "Forbidden - User is not a landlord", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @PostMapping(value = "/rooms", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<RoomDetailResponse> createRoom(
                        @Parameter(description = "Room title", example = "Cozy 2BR Apartment", required = true) @RequestParam String title,

                        @Parameter(description = "Room description", example = "Beautiful apartment in the city center") @RequestParam(required = false) String description,

                        @Parameter(description = "Monthly rent price", example = "5000000", required = true) @RequestParam Double rentPricePerMonth,

                        @Parameter(description = "Minimum stay in months", example = "6", required = true) @RequestParam Integer minimumStayMonths,

                        @Parameter(description = "Room address", example = "123 Main Street", required = true) @RequestParam String address,

                        @Parameter(description = "Latitude coordinate", example = "10.7769") @RequestParam(required = false) Double latitude,

                        @Parameter(description = "Longitude coordinate", example = "106.7009") @RequestParam(required = false) Double longitude,

                        @Parameter(description = "Number of toilets", example = "2", required = true) @RequestParam Integer numberOfToilets,

                        @Parameter(description = "Number of bedrooms", example = "2", required = true) @RequestParam Integer numberOfBedRooms,

                        @Parameter(description = "Has window", example = "true", required = true) @RequestParam boolean hasWindow,

                        @Parameter(description = "Thumbnail image file") @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,

                        @Parameter(description = "Room images") @RequestPart(value = "images", required = false) List<MultipartFile> images,

                        @Parameter(description = "Room videos") @RequestPart(value = "videos", required = false) List<MultipartFile> videos,

                        @Parameter(description = "Room documents") @RequestPart(value = "documents", required = false) List<MultipartFile> documents,

                        @AuthenticationPrincipal CustomUserDetails userDetails) throws IOException {

                String landlordId = userDetails.getUserId();

                // Build the request object from individual parameters
                CreateRoomRequestJSON request = new CreateRoomRequestJSON();
                request.setTitle(title);
                request.setDescription(description);
                request.setRentPricePerMonth(rentPricePerMonth);
                request.setMinimumStayMonths(minimumStayMonths);
                request.setAddress(address);
                request.setLatitude(latitude);
                request.setLongitude(longitude);
                request.setNumberOfToilets(numberOfToilets);
                request.setNumberOfBedRooms(numberOfBedRooms);
                request.setHasWindow(hasWindow);

                // Validate manually since we're not using @Valid on the object
                // You can inject Validator and validate here if needed

                RoomDetailResponse response = landlordService.createRoom(
                                landlordId,
                                request,
                                thumbnail,
                                images,
                                videos,
                                documents);

                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        // ========================================
        // UPDATE ROOM (UNIFIED - INFO + MEDIA)
        // ========================================
        @Operation(summary = "Update room with info and media files", description = "Update room details and media files in a single atomic operation. "
                        +
                        "Provide new files to add and URLs of files to remove.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Room updated successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = RoomDetailResponse.class))),
                        @ApiResponse(responseCode = "400", description = "Invalid request body", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "403", description = "Forbidden - Not the room owner", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "404", description = "Room not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @PutMapping(value = "/rooms/{roomId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<RoomDetailResponse> updateRoom(
                        @Parameter(description = "Room ID", required = true) @PathVariable String roomId,

                        // Basic room information
                        @Parameter(description = "Room title", example = "Cozy 2BR Apartment", required = true) @RequestParam String title,

                        @Parameter(description = "Room description", example = "Beautiful apartment") @RequestParam(required = false) String description,

                        @Parameter(description = "Monthly rent price", example = "5000000", required = true) @RequestParam Double rentPricePerMonth,

                        @Parameter(description = "Minimum stay in months", example = "6", required = true) @RequestParam Integer minimumStayMonths,

                        @Parameter(description = "Room address", example = "123 Main Street", required = true) @RequestParam String address,

                        @Parameter(description = "Latitude coordinate", example = "10.7769") @RequestParam(required = false) Double latitude,

                        @Parameter(description = "Longitude coordinate", example = "106.7009") @RequestParam(required = false) Double longitude,

                        @Parameter(description = "Number of toilets", example = "2", required = true) @RequestParam Integer numberOfToilets,

                        @Parameter(description = "Number of bedrooms", example = "2", required = true) @RequestParam Integer numberOfBedRooms,

                        @Parameter(description = "Has window", example = "true", required = true) @RequestParam Boolean hasWindow,

                        @Parameter(description = "Room status", example = "PUBLISHED") @RequestParam(required = false) String status,

                        // Files to remove (URLs)
                        @Parameter(description = "Image URLs to remove") @RequestParam(required = false) List<String> imagesToRemove,

                        @Parameter(description = "Video URLs to remove") @RequestParam(required = false) List<String> videosToRemove,

                        @Parameter(description = "Document URLs to remove") @RequestParam(required = false) List<String> documentsToRemove,

                        @Parameter(description = "Replace thumbnail (true to remove old)") @RequestParam(required = false, defaultValue = "false") Boolean replaceThumbnail,

                        // New files to add
                        @Parameter(description = "New thumbnail image") @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,

                        @Parameter(description = "New images to add") @RequestPart(value = "images", required = false) List<MultipartFile> images,

                        @Parameter(description = "New videos to add") @RequestPart(value = "videos", required = false) List<MultipartFile> videos,

                        @Parameter(description = "New documents to add") @RequestPart(value = "documents", required = false) List<MultipartFile> documents,

                        @AuthenticationPrincipal CustomUserDetails userDetails) throws IOException {

                String landlordId = userDetails.getUserId();

                // Build request object
                UpdateRoomWithBothInfoAndMediaRequest request = new UpdateRoomWithBothInfoAndMediaRequest();
                request.setTitle(title);
                request.setDescription(description);
                request.setRentPricePerMonth(rentPricePerMonth);
                request.setMinimumStayMonths(minimumStayMonths);
                request.setAddress(address);
                request.setLatitude(latitude);
                request.setLongitude(longitude);
                request.setNumberOfToilets(numberOfToilets);
                request.setNumberOfBedRooms(numberOfBedRooms);
                request.setHasWindow(hasWindow);
                request.setStatus(status != null ? org.example.Broomate.model.Room.RoomStatus.valueOf(status) : null);
                request.setImagesToRemove(imagesToRemove);
                request.setVideosToRemove(videosToRemove);
                request.setDocumentsToRemove(documentsToRemove);
                request.setReplaceThumbnail(replaceThumbnail);

                RoomDetailResponse response = landlordService.updateRoomBothInfoAndMediaFile(
                                landlordId,
                                roomId,
                                request,
                                thumbnail,
                                images,
                                videos,
                                documents);

                return ResponseEntity.ok(response);
        }
        // ========================================
        // LANDLORD PROFILE
        // ========================================

        // ========================================
        // UPDATE LANDLORD PROFILE (WITH AVATAR)
        // ========================================
        @Operation(summary = "Update landlord profile with avatar", description = "Update landlord information and avatar in a single request")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Profile updated successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = LandlordProfileResponse.class))),
                        @ApiResponse(responseCode = "400", description = "Invalid request", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<LandlordProfileResponse> updateProfile(
                        @Parameter(description = "Landlord name", required = true, example = "John Smith") @RequestParam String name,

                        @Parameter(description = "Phone number", example = "0901234567") @RequestParam(required = false) String phone,

                        @Parameter(description = "Profile description", example = "Experienced landlord with 10+ properties") @RequestParam(required = false) String description,

                        @Parameter(description = "Set to true to remove current avatar") @RequestParam(required = false, defaultValue = "false") Boolean removeAvatar,

                        @Parameter(description = "New avatar image (replaces existing if provided)") @RequestPart(value = "avatar", required = false) MultipartFile avatar,

                        @AuthenticationPrincipal CustomUserDetails userDetails) throws IOException {

                String landlordId = userDetails.getUserId();

                // Build request object
                UpdateLandlordProfileRequest request = UpdateLandlordProfileRequest.builder()
                                .name(name)
                                .phone(phone)
                                .description(description)
                                .removeAvatar(removeAvatar)
                                .build();

                LandlordProfileResponse response = landlordService.updateProfile(landlordId, request, avatar);
                return ResponseEntity.ok(response);
        }

        @Operation(summary = "Get landlord profile")
        // ✅ RECOMMENDED - Only allow viewing own profile
        @GetMapping("/profile")
        public ResponseEntity<LandlordProfileResponse> getProfile(
                        @AuthenticationPrincipal CustomUserDetails userDetails) {
                String landlordId = userDetails.getUserId();
                LandlordProfileResponse response = landlordService.getProfile(landlordId);
                return ResponseEntity.ok(response);
        }

        // ========================================
        // GET ALL ROOMS FOR CURRENT LANDLORD
        // ========================================
        @Operation(summary = "Get all rooms owned by the current landlord", description = "Returns a list of all rooms created by the authenticated landlord")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Rooms retrieved successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = RoomDetailResponse.class))),
                        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "403", description = "Forbidden - User is not a landlord", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @GetMapping("/rooms")
        public ResponseEntity<List<RoomDetailResponse>> getMyRooms(
                        @AuthenticationPrincipal CustomUserDetails userDetails) {
                String landlordId = userDetails.getUserId();
                List<RoomDetailResponse> rooms = landlordService.getMyRooms(landlordId);
                return ResponseEntity.ok(rooms);
        }
}