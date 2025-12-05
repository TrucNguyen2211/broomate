package org.example.Broomate.dto.response.allAuthUser;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.Broomate.model.Conversation;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Conversation detail response")
public class ConversationDetailResponse {

    @Schema(description = "Conversation ID", example = "conv123")
    private String id;

    @Schema(description = "Participant IDs", example = "[\"user1\", \"user2\"]")
    private List<String> participantIds;

    @Schema(description = "Other participant's user ID (only for 2-way conversations)", example = "user456")
    private String otherParticipantId;

    @Schema(description = "Other participant's name (only for 2-way conversations)", example = "Jane Doe")
    private String otherParticipantName;

    @Schema(description = "Other participant's avatar URL (only for 2-way conversations)", example = "https://example.com/avatar.jpg")
    private String otherParticipantAvatar;

    @Schema(description = "Last message content", example = "Hello, is this room still available?")
    private String lastMessage;

    @Schema(description = "Last message timestamp", example = "2025-10-24T12:30:00Z")
    private String lastMessageAt;

    @Schema(description = "Unread message count", example = "3")
    private Integer unreadCount;

    @Schema(description = "List of messages in this conversation")
    private List<MessageDetailResponse> messages;

    @Schema(description = "Total message count", example = "15")
    private Integer totalMessages;

    @Schema(description = "Created timestamp", example = "2025-10-20T10:00:00Z")
    private String createdAt;

    @Schema(description = "Updated timestamp", example = "2025-10-24T12:30:00Z")
    private String updatedAt;

    // ✅ For 3-way conversations
    @Schema(description = "All participants in this conversation (for 3+ way conversations)")
    private List<ParticipantInfo> allParticipants;

    @Schema(description = "Conversation type", example = "TWO_WAY or THREE_WAY")
    private String conversationType;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantInfo {
        private String userId;
        private String name;
        private String avatarUrl;
        private String role; // "TENANT" or "LANDLORD"
    }

    // ✅ ORIGINAL: For conversation list (without messages)
    public static ConversationDetailResponse fromConversation(
            Conversation conversation,
            String currentUserId,
            String otherParticipantName,
            String otherParticipantAvatar
    ) {
        String otherParticipantId = conversation.getParticipantIds().stream()
                .filter(id -> !id.equals(currentUserId))
                .findFirst()
                .orElse(null);

        return ConversationDetailResponse.builder()
                .id(conversation.getId())
                .participantIds(conversation.getParticipantIds())
                .otherParticipantId(otherParticipantId)
                .otherParticipantName(otherParticipantName)
                .otherParticipantAvatar(otherParticipantAvatar)
                .lastMessage(conversation.getLastMessage())
                .lastMessageAt(conversation.getLastMessageAt() != null ?
                        conversation.getLastMessageAt().toString() : null)
                .unreadCount(0)
                .createdAt(conversation.getCreatedAt() != null ?
                        conversation.getCreatedAt().toString() : null)
                .updatedAt(conversation.getUpdatedAt() != null ?
                        conversation.getUpdatedAt().toString() : null)
                .build();
    }

    // ✅ NEW: Updated method for conversation detail (with messages and all participants)
    public static ConversationDetailResponse fromConversationWithMessages(
            Conversation conversation,
            String currentUserId,
            List<MessageDetailResponse> messages,
            List<ParticipantInfo> allParticipants // ✅ NEW PARAMETER
    ) {
        int participantCount = conversation.getParticipantIds().size();
        String conversationType = participantCount == 2 ? "TWO_WAY" : "THREE_WAY";

        String otherParticipantId = null;
        String otherParticipantName = null;
        String otherParticipantAvatar = null;

        // Only set for 2-way conversations
        if (participantCount == 2 && allParticipants != null && !allParticipants.isEmpty()) {
            // Get the other participant (not current user)
            ParticipantInfo otherParticipant = allParticipants.stream()
                    .filter(p -> !p.getUserId().equals(currentUserId))
                    .findFirst()
                    .orElse(null);

            if (otherParticipant != null) {
                otherParticipantId = otherParticipant.getUserId();
                otherParticipantName = otherParticipant.getName();
                otherParticipantAvatar = otherParticipant.getAvatarUrl();
            }
        }

        return ConversationDetailResponse.builder()
                .id(conversation.getId())
                .participantIds(conversation.getParticipantIds())
                .otherParticipantId(otherParticipantId)
                .otherParticipantName(otherParticipantName)
                .otherParticipantAvatar(otherParticipantAvatar)
                .lastMessage(conversation.getLastMessage())
                .lastMessageAt(conversation.getLastMessageAt() != null ?
                        conversation.getLastMessageAt().toString() : null)
                .unreadCount(0)
                .messages(messages)
                .totalMessages(messages != null ? messages.size() : 0)
                .allParticipants(allParticipants) // ✅ POPULATED
                .conversationType(conversationType)
                .createdAt(conversation.getCreatedAt() != null ?
                        conversation.getCreatedAt().toString() : null)
                .updatedAt(conversation.getUpdatedAt() != null ?
                        conversation.getUpdatedAt().toString() : null)
                .build();
    }
}