package org.example.Broomate.service;

import com.google.cloud.Timestamp;
import lombok.extern.slf4j.Slf4j;
import org.example.Broomate.dto.request.allAuthUser.ChangePasswordRequest;
import org.example.Broomate.dto.request.allAuthUser.SendMessageRequest;
import org.example.Broomate.dto.response.*;
import org.example.Broomate.dto.response.allAuthUser.*;
import org.example.Broomate.dto.websocket.NewMessageNotification;
import org.example.Broomate.model.Account;
import org.example.Broomate.model.Conversation;
import org.example.Broomate.model.Message;
import org.example.Broomate.model.Room;
import org.example.Broomate.repository.AllAuthUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AllAuthUserService {

        @Autowired
        private AllAuthUserRepository repository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Autowired
        private FileStorageService fileStorageService;
        @Autowired
        private WebSocketService webSocketService;

        // ========================================
        // 1. GET ALL CONVERSATIONS (UPDATED)
        // ========================================
        public ConversationListResponse getAllConversations(String userId) {
                log.info("Getting all conversations for user: {}", userId);

                List<Conversation> conversations = repository.findConversationsByUserId(userId);

                // ✅ UPDATED: Enrich conversations with participant data
                List<ConversationDetailResponse> conversationResponses = conversations.stream()
                        .map(conversation -> enrichConversation(conversation, userId))
                        .collect(Collectors.toList());

                log.info("Found {} conversations for user: {}", conversationResponses.size(), userId);

                return ConversationListResponse.builder()
                        .conversations(conversationResponses)
                        .totalCount(conversationResponses.size())
                        .message("Conversations retrieved successfully")
                        .build();
        }

        /**
         * ✅ NEW METHOD: Enrich a conversation with participant data
         */
        private ConversationDetailResponse enrichConversation(Conversation conversation, String currentUserId) {
                // Find the other participant (not the current user)
                String otherUserId = conversation.getParticipantIds().stream()
                        .filter(id -> !id.equals(currentUserId))
                        .findFirst()
                        .orElse(null);

                if (otherUserId == null) {
                        log.warn("Could not find other participant in conversation: {}", conversation.getId());
                        return ConversationDetailResponse.fromConversation(
                                conversation,
                                currentUserId,
                                "Unknown User",
                                null);
                }

                // Fetch the other user's account
                Account otherUser = repository.findAccountById(otherUserId).orElse(null);

                if (otherUser == null) {
                        log.warn("Other participant not found for ID: {}", otherUserId);
                        return ConversationDetailResponse.fromConversation(
                                conversation,
                                currentUserId,
                                "Deleted User",
                                null);
                }

                // Return conversation with enriched data
                return ConversationDetailResponse.fromConversation(
                        conversation,
                        currentUserId,
                        otherUser.getName(),
                        otherUser.getAvatarUrl());
        }

        // ========================================
        // 2. GET ALL ROOMS
        // ========================================
        public RoomListResponse getAllRooms() {
                log.info("Getting all published rooms");

                List<Room> rooms = repository.findAllPublishedRooms();

                List<RoomDetailResponse> roomResponses = rooms.stream()
                        .map(RoomDetailResponse::fromRoom)
                        .collect(Collectors.toList());

                log.info("Found {} rooms", roomResponses.size());

                return RoomListResponse.builder()
                        .rooms(roomResponses)
                        .totalCount(roomResponses.size())
                        .message("Rooms retrieved successfully")
                        .build();
        }

        // ========================================
        // 3. GET ROOM DETAIL
        // ========================================
        public RoomDetailResponse getRoomDetail(String roomId) {
                log.info("Getting room detail for ID: {}", roomId);

                Room room = repository.findRoomById(roomId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Room not found with ID: " + roomId));

                return RoomDetailResponse.fromRoom(room);
        }

        // ========================================
        // 4. CHANGE PASSWORD
        // ========================================
        public HTTPMessageResponse changePassword(String userId, ChangePasswordRequest request) {
                log.info("Changing password for user: {}", userId);

                Account account = repository.findAccountById(userId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found with ID: " + userId));

                if (!passwordEncoder.matches(request.getCurrentPassword(), account.getPassword())) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Current password is incorrect");
                }

                String hashedNewPassword = passwordEncoder.encode(request.getNewPassword());
                account.setPassword(hashedNewPassword);
                account.setUpdatedAt(Timestamp.now());

                repository.updateAccount(userId, account);

                log.info("Password changed successfully for user: {}", userId);

                return HTTPMessageResponse.builder()
                        .message("Password changed successfully")
                        .build();
        }

        // ========================================
        // 5. SEND MESSAGE WITH MEDIA
        // ========================================
        public MessageDetailResponse sendMessage(
                String userId,
                String conversationId,
                SendMessageRequest request,
                MultipartFile media) throws IOException {

                log.info("Sending message in conversation: {} from user: {}", conversationId, userId);

                String uploadedMediaUrl = null;

                try {
                        Conversation conversation = repository.findConversationById(conversationId)
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Conversation not found with ID: " + conversationId));

                        if (!conversation.getParticipantIds().contains(userId)) {
                                // ✅ FIXED: Use ResponseStatusException
                                throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "You are not a participant in this conversation");
                        }

                        if (media != null && !media.isEmpty()) {
                                String folder = determineMediaFolder(media);
                                uploadedMediaUrl = fileStorageService.uploadFile(media, folder);
                                log.info("Media uploaded successfully: {}", uploadedMediaUrl);
                        }

                        List<String> mediaUrls = uploadedMediaUrl != null
                                ? List.of(uploadedMediaUrl)
                                : List.of();

                        Message message = Message.builder()
                                .id(UUID.randomUUID().toString())
                                .conversationId(conversationId)
                                .senderId(userId)
                                .content(request.getContent())
                                .mediaUrls(mediaUrls)
                                .readBy(List.of(userId))
                                .createdAt(Timestamp.now())
                                .updatedAt(Timestamp.now())
                                .build();

                        repository.saveMessage(message);

                        conversation.setLastMessage(request.getContent());
                        conversation.setLastMessageAt(Timestamp.now());
                        conversation.setUpdatedAt(Timestamp.now());
                        repository.updateConversation(conversationId, conversation);

                        log.info("Message sent successfully in conversation: {}", conversationId);
                        // ✅ NEW: Send WebSocket notification to the other participant
                        String otherUserId = conversation.getParticipantIds().stream()
                                .filter(id -> !id.equals(userId))
                                .findFirst()
                                .orElse(null);

                        if (otherUserId != null) {
                                // Get sender info
                                Account sender = repository.findAccountById(userId).orElse(null);

                                NewMessageNotification notification = NewMessageNotification.builder()
                                        .messageId(message.getId())
                                        .conversationId(conversationId)
                                        .senderId(userId)
                                        .senderName(sender != null ? sender.getName() : "Unknown User")
                                        .senderAvatar(sender != null ? sender.getAvatarUrl() : null)
                                        .content(request.getContent())
                                        .mediaUrls(mediaUrls)
                                        .build();

                                webSocketService.sendNewMessageNotification(otherUserId, notification);
                        }

                        log.info("Message sent successfully in conversation: {}", conversationId);

                        return MessageDetailResponse.fromMessage(message);

                } catch (Exception e) {
                        log.error("Failed to send message, rolling back uploaded media", e);
                        if (uploadedMediaUrl != null) {
                                fileStorageService.deleteFile(uploadedMediaUrl);
                        }

                        if (e instanceof ResponseStatusException || e instanceof AccessDeniedException) {
                                throw e;
                        }
                        throw new ResponseStatusException(
                                HttpStatus.INTERNAL_SERVER_ERROR,
                                "Failed to send message: " + e.getMessage());
                }
        }

        private String determineMediaFolder(MultipartFile file) {
                String contentType = file.getContentType();

                if (contentType == null) {
                        return "documents";
                }

                if (contentType.startsWith("image/")) {
                        return "images";
                } else if (contentType.startsWith("video/")) {
                        return "videos";
                } else {
                        return "documents";
                }
        }

        // ========================================
        // 6. DEACTIVATE PROFILE
        // ========================================
        public HTTPMessageResponse deactivateProfile(String userId) {
                log.info("Deactivating profile for user: {}", userId);

                Account account = repository.findAccountById(userId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found with ID: " + userId));

                account.setActive(false);
                account.setUpdatedAt(Timestamp.now());

                repository.updateAccount(userId, account);

                log.info("Profile deactivated for user: {}", userId);

                return HTTPMessageResponse.builder()
                        .message("Profile deactivated successfully")
                        .build();
        }

        // ========================================
        // 7. ACTIVATE PROFILE
        // ========================================
        public HTTPMessageResponse activateProfile(String userId) {
                log.info("Activating profile for user: {}", userId);

                Account account = repository.findAccountById(userId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found with ID: " + userId));

                account.setActive(true);
                account.setUpdatedAt(Timestamp.now());

                repository.updateAccount(userId, account);

                log.info("Profile activated for user: {}", userId);

                return HTTPMessageResponse.builder()
                        .message("Profile activated successfully")
                        .build();
        }

        // ========================================
// 1.5. GET CONVERSATION DETAIL WITH MESSAGES
// ========================================
        public ConversationDetailResponse getConversationDetail(String conversationId, String userId) {
                log.info("Getting conversation detail for ID: {} by user: {}", conversationId, userId);

                // Find conversation
                Conversation conversation = repository.findConversationById(conversationId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Conversation not found with ID: " + conversationId));

                if (!conversation.getParticipantIds().contains(userId)) {
                        throw new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "You are not a participant in this conversation");
                }

                // Get all messages in conversation
                List<Message> messages = repository.findMessagesByConversationId(conversationId);

                // ✅ Enrich each message with sender info
                List<MessageDetailResponse> messageResponses = messages.stream()
                        .map(message -> {
                                Account sender = repository.findAccountById(message.getSenderId()).orElse(null);

                                String senderName = sender != null ? sender.getName() : "Unknown User";
                                String senderAvatar = sender != null ? sender.getAvatarUrl() : null;

                                return MessageDetailResponse.fromMessageWithSender(
                                        message,
                                        senderName,
                                        senderAvatar
                                );
                        })
                        .collect(Collectors.toList());

                // ✅ Build allParticipants list
                List<ConversationDetailResponse.ParticipantInfo> allParticipants = new ArrayList<>();

                for (String participantId : conversation.getParticipantIds()) {
                        Account participant = repository.findAccountById(participantId).orElse(null);

                        if (participant != null) {
                                ConversationDetailResponse.ParticipantInfo participantInfo =
                                        ConversationDetailResponse.ParticipantInfo.builder()
                                                .userId(participantId)
                                                .name(participant.getName())
                                                .avatarUrl(participant.getAvatarUrl())
                                                .role(participant.getRole().toString()) // "TENANT" or "LANDLORD"
                                                .build();

                                allParticipants.add(participantInfo);
                        }
                }

                // Build response with all participants
                ConversationDetailResponse response = ConversationDetailResponse.fromConversationWithMessages(
                        conversation,
                        userId,
                        messageResponses,
                        allParticipants // ✅ PASS THE LIST
                );

                log.info("Found {} messages in conversation: {}", messageResponses.size(), conversationId);

                return response;
        }
}