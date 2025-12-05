package org.example.Broomate.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.Broomate.config.CustomUserDetails;
import org.example.Broomate.dto.request.tenant.UpdateTenantProfileRequest;
import org.example.Broomate.dto.request.tenant.SwipeRequest;
import org.example.Broomate.dto.response.tenant.BookmarkResponse;
import org.example.Broomate.dto.response.tenant.TenantProfileResponse;
import org.example.Broomate.dto.response.tenant.TenantListResponse;
import org.example.Broomate.dto.response.tenant.SwipeResponse;
import org.example.Broomate.dto.response.ErrorResponse;
import org.example.Broomate.service.TenantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/tenant")
@Tag(name = "Tenant", description = "APIs available only for tenants")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    /**
     * GET ALL TENANTS FOR SWIPING
     */
    @Operation(summary = "Get all tenants for swiping",
            description = "Retrieve all tenant profiles for swiping/matching. " +
                    "Excludes already rejected (within 10 min), matched, and already swiped tenants.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved tenant profiles",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = TenantListResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - User is not a tenant",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/profiles")
    public ResponseEntity<TenantListResponse> getAllTenants(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String currentTenantId = userDetails.getUserId();
        TenantListResponse response = tenantService.getAllTenantsForSwiping(currentTenantId);
        return ResponseEntity.ok(response);
    }


    /**
     * SWIPE TENANT
     */
    @Operation(summary = "Swipe tenant profile",
            description = "Swipe left (reject) or right (accept) on another tenant. " +
                    "If both accept, a match is created with automatic conversation.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Swipe recorded successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = SwipeResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request - Cannot swipe on yourself",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Target tenant not found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Already swiped on this tenant",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/swipe")
    public ResponseEntity<SwipeResponse> swipeTenant(
            @Valid @RequestBody SwipeRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String swiperTenantId = userDetails.getUserId();
        SwipeResponse response = tenantService.swipeTenant(swiperTenantId, request);
        return ResponseEntity.ok(response);
    }

    // ========================================
// UPDATE TENANT PROFILE (WITH AVATAR)
// ========================================
    @Operation(
            summary = "Update tenant profile with avatar",
            description = "Update tenant profile information and avatar in a single request"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile successfully updated",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = TenantProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body or validation error",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Tenant not found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TenantProfileResponse> updateTenantProfile(
            @Parameter(description = "Tenant name", required = true, example = "John Doe")
            @RequestParam String name,

            @Parameter(description = "Profile description", example = "Looking for a quiet place")
            @RequestParam(required = false) String description,

            @Parameter(description = "Monthly budget", example = "5000000")
            @RequestParam(required = false) Double budgetPerMonth,

            @Parameter(description = "Stay length in months", example = "6")
            @RequestParam(required = false) Integer stayLength,

            @Parameter(description = "Move-in date", example = "2025-01-01")
            @RequestParam(required = false) String moveInDate,

            @Parameter(description = "Preferred locations")
            @RequestParam(required = false) List<String> preferredLocations,

            @Parameter(description = "Phone number", example = "0901234567")
            @RequestParam(required = false) String phone,

            @Parameter(description = "Age", example = "25")
            @RequestParam(required = false) Integer age,

            @Parameter(description = "Gender", example = "MALE")
            @RequestParam(required = false) String gender,

            @Parameter(description = "Is smoker", example = "false")
            @RequestParam(required = false, defaultValue = "false") boolean smoking,

            @Parameter(description = "Cooks regularly", example = "true")
            @RequestParam(required = false, defaultValue = "false") boolean cooking,

            @Parameter(description = "Needs window", example = "true")
            @RequestParam(required = false, defaultValue = "false") boolean needWindow,

            @Parameter(description = "Willing to share bedroom", example = "false")
            @RequestParam(required = false, defaultValue = "false") boolean mightShareBedRoom,

            @Parameter(description = "Willing to share toilet", example = "true")
            @RequestParam(required = false, defaultValue = "false") boolean mightShareToilet,

            @Parameter(description = "Set to true to remove current avatar")
            @RequestParam(required = false, defaultValue = "false") Boolean removeAvatar,

            @Parameter(description = "New avatar image (replaces existing if provided)")
            @RequestPart(value = "avatar", required = false) MultipartFile avatar,

            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws IOException {

        String tenantId = userDetails.getUserId();

        // Build request object
        UpdateTenantProfileRequest request = UpdateTenantProfileRequest.builder()
                .name(name)
                .description(description)
                .budgetPerMonth(budgetPerMonth)
                .stayLength(stayLength)
                .moveInDate(moveInDate)
                .preferredLocations(preferredLocations)
                .phone(phone)
                .age(age)
                .gender(gender)
                .smoking(smoking)
                .cooking(cooking)
                .needWindow(needWindow)
                .mightShareBedRoom(mightShareBedRoom)
                .mightShareToilet(mightShareToilet)
                .removeAvatar(removeAvatar)
                .build();

        TenantProfileResponse response = tenantService.updateTenantProfile(tenantId, request, avatar);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get another tenant profile details for swiping")
    @GetMapping("/profile/{tenantId}")
    public ResponseEntity<TenantProfileResponse> getTenantProfile(
            @Parameter(description = "Tenant ID", required = true)
            @PathVariable String tenantId
    ) {
        TenantProfileResponse response = tenantService.getTenantProfile(tenantId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get my profile")
    @GetMapping("/profile")
    public ResponseEntity<TenantProfileResponse> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String tenantId = userDetails.getUserId();
        TenantProfileResponse response = tenantService.getTenantProfile(tenantId);
        return ResponseEntity.ok(response);
    }
    // ========================================
// BOOKMARK MANAGEMENT
// ========================================

    @Operation(
            summary = "Bookmark a room",
            description = "Add a room to your bookmarks/favorites"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Room bookmarked successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = BookmarkResponse.class))),
            @ApiResponse(responseCode = "404", description = "Room or tenant not found"),
            @ApiResponse(responseCode = "409", description = "Room already bookmarked")
    })
    @PostMapping("/bookmarks/rooms/{roomId}")
    public ResponseEntity<BookmarkResponse> bookmarkRoom(
            @Parameter(description = "Room ID to bookmark", required = true)
            @PathVariable String roomId,

            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String tenantId = userDetails.getUserId();
        BookmarkResponse response = tenantService.bookmarkRoom(tenantId, roomId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
            summary = "Unbookmark a room",
            description = "Remove a room from your bookmarks/favorites"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Room unbookmarked successfully"),
            @ApiResponse(responseCode = "404", description = "Bookmark not found")
    })
    @DeleteMapping("/bookmarks/rooms/{roomId}")
    public ResponseEntity<Void> unbookmarkRoom(
            @Parameter(description = "Room ID to unbookmark", required = true)
            @PathVariable String roomId,

            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String tenantId = userDetails.getUserId();
        tenantService.unbookmarkRoom(tenantId, roomId);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Get all bookmarked rooms",
            description = "Retrieve all rooms that you have bookmarked with full room details"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Bookmarks retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = BookmarkResponse.class)))
    })
    @GetMapping("/bookmarks")
    public ResponseEntity<List<BookmarkResponse>> getAllBookmarks(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String tenantId = userDetails.getUserId();
        List<BookmarkResponse> response = tenantService.getAllBookmarks(tenantId);
        return ResponseEntity.ok(response);
    }
}