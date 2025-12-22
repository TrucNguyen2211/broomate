package org.example.Broomate.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class NewMessageNotification extends WebSocketMessage {
    private String messageId;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private List<String> mediaUrls;
    
    // ✅ ADD THIS FIELD
    private String timestamp;  // Message timestamp in ISO format
}