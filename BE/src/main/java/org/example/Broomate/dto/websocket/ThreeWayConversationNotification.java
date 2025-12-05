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
public class ThreeWayConversationNotification extends WebSocketMessage {

    private String conversationId;
    private String roomId;
    private String roomTitle;
    private String roomImageUrl;
    private List<String> participantIds;
    private List<ParticipantInfo> participants;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @lombok.Builder
    public static class ParticipantInfo {
        private String userId;
        private String name;
        private String avatarUrl;
        private String role; // "TENANT" or "LANDLORD"
    }
}