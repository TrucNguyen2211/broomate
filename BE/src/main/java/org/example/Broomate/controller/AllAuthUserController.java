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

import org.example.Broomate.config.CustomUserDetails;
import org.example.Broomate.dto.request.allAuthUser.ChangePasswordRequest;
import org.example.Broomate.dto.request.allAuthUser.SendMessageRequest;
import org.example.Broomate.dto.response.*;
import org.example.Broomate.dto.response.allAuthUser.*;
import org.example.Broomate.service.AllAuthUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/user")
@Tag(name = "All Authenticated Users", description = "APIs available for both tenants and landlords")
@SecurityRequirement(name = "bearerAuth")
public class AllAuthUserController {

    @Autowired
    private AllAuthUserService allAuthUserService;

    /**
     * 1. GET ALL CONVERSATIONS
     */
    @Operation(summary = "Get all conversations",
            description = "Retrieve all conversations for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conversations retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ConversationListResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/conversations")
    public ResponseEntity<ConversationListResponse> getAllConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String userId = userDetails.getUserId();
        ConversationListResponse response = allAuthUserService.getAllConversations(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 2. GET ALL ROOMS
     */
    @Operation(summary = "Get all rooms",
            description = "Retrieve all published rooms (for browsing)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rooms retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = RoomListResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/rooms")
    public ResponseEntity<RoomListResponse> getAllRooms(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        RoomListResponse response = allAuthUserService.getAllRooms();
        return ResponseEntity.ok(response);
    }

    /**
     * 3. GET ROOM DETAIL
     */
    @Operation(summary = "Get room details",
            description = "Retrieve detailed information about a specific room")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Room details retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = RoomDetailResponse.class))),
            @ApiResponse(responseCode = "404", description = "Room not found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<RoomDetailResponse> getRoomDetail(
            @PathVariable String roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        RoomDetailResponse response = allAuthUserService.getRoomDetail(roomId);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. CHANGE PASSWORD
     */
    @Operation(summary = "Change password",
            description = "Change the authenticated user's password")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password changed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = HTTPMessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid current password",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/change-password")
    public ResponseEntity<HTTPMessageResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String userId = userDetails.getUserId();
        HTTPMessageResponse response = allAuthUserService.changePassword(userId,request);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. SEND MESSAGE
     */
    @Operation(
            summary = "Send a message with optional media",
            description = "Send a text message with an optional media file (image, video, or document). Only one file per message."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Message sent successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MessageDetailResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not a conversation participant"),
            @ApiResponse(responseCode = "404", description = "Conversation not found")
    })
    @PostMapping(value = "/conversations/{conversationId}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageDetailResponse> sendMessage(
            @Parameter(description = "Conversation ID", required = true)
            @PathVariable String conversationId,

            @Parameter(description = "Message content", required = true, example = "Hello, is this room still available?")
            @RequestParam String content,

            @Parameter(description = "Optional media file (image, video, or document)")
            @RequestPart(value = "media", required = false) MultipartFile media,

            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws IOException {
        String userId = userDetails.getUserId();

        // Build request
        SendMessageRequest request = SendMessageRequest.builder()
                .content(content)
                .build();

        MessageDetailResponse response = allAuthUserService.sendMessage(userId, conversationId, request, media);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    /**
     * 6. DEACTIVATE PROFILE
     */
    @Operation(summary = "Deactivate profile",
            description = "Deactivate the authenticated user's account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile deactivated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MessageDetailResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/deactivate")
    public ResponseEntity<HTTPMessageResponse> deactivateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String userId = userDetails.getUserId();
        HTTPMessageResponse response = allAuthUserService.deactivateProfile(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 7. ACTIVATE PROFILE
     */
    @Operation(summary = "Activate profile",
            description = "Reactivate the authenticated user's account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile activated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MessageDetailResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/activate/{userId}")
    public ResponseEntity<HTTPMessageResponse> activateProfile(

            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String userId = userDetails.getUserId();

        HTTPMessageResponse response = allAuthUserService.activateProfile(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 1.5. GET CONVERSATION DETAIL WITH MESSAGES
     */
    /**
     * 1.5. GET CONVERSATION DETAIL WITH MESSAGES
     */
    @Operation(summary = "Get conversation detail with messages",
            description = "Retrieve detailed information about a specific conversation including all messages")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conversation details retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ConversationDetailResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not a conversation participant",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Conversation not found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationDetailResponse> getConversationDetail(
            @PathVariable String conversationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String userId = userDetails.getUserId();
        ConversationDetailResponse response = allAuthUserService.getConversationDetail(conversationId, userId);
        return ResponseEntity.ok(response);
    }
}