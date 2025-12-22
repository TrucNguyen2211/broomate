package org.example.Broomate.service;

import com.google.cloud.Timestamp;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.Broomate.dto.websocket.NewMessageNotification;
import org.example.Broomate.dto.websocket.NewSwipeNotification;
import org.example.Broomate.dto.websocket.ThreeWayConversationNotification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final SimpUserRegistry userRegistry;

    /**
     * Send new message notification to a specific user
     */
    public void sendNewMessageNotification(String userId, NewMessageNotification notification) {
        notification.setType("NEW_MESSAGE");

        log.info("🔔 Sending new message notification to user: {}", userId);
        log.info("📨 Notification content: {}", notification.getContent());
        log.info("📍 Destination: /user/{}/queue/messages", userId);

        // Check if user is connected
        boolean isUserConnected = userRegistry.getUser(userId) != null;
        log.info("🔌 Is user {} connected? {}", userId, isUserConnected);

        if (!isUserConnected) {
            log.warn("⚠️ User {} is NOT connected to WebSocket!", userId);
            log.info("📋 Currently connected users: {}", userRegistry.getUserCount());
        }

        try {
            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/messages",
                    notification
            );
            log.info("✅ Message notification sent successfully to user: {}", userId);
        } catch (Exception e) {
            log.error("❌ Failed to send notification to user {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Send new swipe notification to a specific user
     */
    public void sendNewSwipeNotification(String userId, NewSwipeNotification notification) {
        notification.setType("NEW_SWIPE");
        notification.setTimestamp(Timestamp.now().toString());

        log.info("🔔 Sending new swipe notification to user: {}", userId);

        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/swipes",
                notification
        );
    }

    /**
     * Send match notification to both users
     */
    public void sendMatchNotification(String userId1, String userId2, NewSwipeNotification notification) {
        notification.setType("NEW_SWIPE");
        notification.setTimestamp(Timestamp.now().toString());
        notification.setIsMatch(true);

        log.info("🔔 Sending match notification to users: {} and {}", userId1, userId2);

        messagingTemplate.convertAndSendToUser(userId1, "/queue/swipes", notification);
        messagingTemplate.convertAndSendToUser(userId2, "/queue/swipes", notification);
    }

    /**
     * ✅ NEW: Send 3-way conversation notification to all participants
     */
    public void sendThreeWayConversationNotification(
            String conversationId,
            String roomId,
            String roomTitle,
            String roomImageUrl,
            List<String> participantIds,
            List<ThreeWayConversationNotification.ParticipantInfo> participants
    ) {
        log.info("🔔 Sending 3-way conversation notifications for conversation: {}", conversationId);
        log.info("👥 Participants: {}", participantIds);

        // Build notification
        ThreeWayConversationNotification notification = ThreeWayConversationNotification.builder()
                .type("THREE_WAY_CONVERSATION_CREATED")
                .timestamp(Timestamp.now().toString())
                .conversationId(conversationId)
                .roomId(roomId)
                .roomTitle(roomTitle)
                .roomImageUrl(roomImageUrl)
                .participantIds(participantIds)
                .participants(participants)
                .build();

        // Send to all 3 participants
        for (String participantId : participantIds) {
            try {
                boolean isConnected = userRegistry.getUser(participantId) != null;
                log.info("🔌 User {} connected? {}", participantId, isConnected);

                messagingTemplate.convertAndSendToUser(
                        participantId,
                        "/queue/conversations", // New queue for conversation-related notifications
                        notification
                );

                log.info("✅ 3-way conversation notification sent to user: {}", participantId);
            } catch (Exception e) {
                log.error("❌ Failed to send 3-way notification to user {}: {}",
                        participantId, e.getMessage(), e);
            }
        }
    }
}