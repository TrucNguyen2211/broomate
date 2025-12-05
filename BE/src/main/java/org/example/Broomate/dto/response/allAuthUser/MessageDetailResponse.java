package org.example.Broomate.dto.response.allAuthUser;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.Broomate.model.Message;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Message detail response")
public class MessageDetailResponse {

    @Schema(description = "Message ID", example = "msg123")
    private String id;

    @Schema(description = "Conversation ID", example = "conv456")
    private String conversationId;

    @Schema(description = "Sender ID", example = "user789")
    private String senderId;

    // ✅ ADD THESE FIELDS
    @Schema(description = "Sender name", example = "John Doe")
    private String senderName;

    @Schema(description = "Sender avatar URL", example = "https://example.com/avatar.jpg")
    private String senderAvatar;

    @Schema(description = "Message content", example = "Hello, is this room still available?")
    private String content;

    @Schema(description = "Media URLs", example = "[\"https://example.com/image.jpg\"]")
    private List<String> mediaUrls;

    @Schema(description = "User IDs who have read this message", example = "[\"user1\", \"user2\"]")
    private List<String> readBy;

    @Schema(description = "Created timestamp", example = "2025-10-24T12:30:00Z")
    private String createdAt;

    @Schema(description = "Updated timestamp", example = "2025-10-24T12:30:00Z")
    private String updatedAt;

    // ✅ UPDATED: Basic factory method (without sender info)
    public static MessageDetailResponse fromMessage(Message message) {
        return MessageDetailResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .senderId(message.getSenderId())
                .senderName(null) // Will be populated later
                .senderAvatar(null)
                .content(message.getContent())
                .mediaUrls(message.getMediaUrls())
                .readBy(message.getReadBy())
                .createdAt(message.getCreatedAt() != null ?
                        message.getCreatedAt().toString() : null)
                .updatedAt(message.getUpdatedAt() != null ?
                        message.getUpdatedAt().toString() : null)
                .build();
    }

    // ✅ NEW: Factory method with sender info
    public static MessageDetailResponse fromMessageWithSender(
            Message message,
            String senderName,
            String senderAvatar
    ) {
        return MessageDetailResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .senderId(message.getSenderId())
                .senderName(senderName)
                .senderAvatar(senderAvatar)
                .content(message.getContent())
                .mediaUrls(message.getMediaUrls())
                .readBy(message.getReadBy())
                .createdAt(message.getCreatedAt() != null ?
                        message.getCreatedAt().toString() : null)
                .updatedAt(message.getUpdatedAt() != null ?
                        message.getUpdatedAt().toString() : null)
                .build();
    }
}