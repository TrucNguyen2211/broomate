package org.example.Broomate.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class NewSwipeNotification extends WebSocketMessage {
    private String swipeId;
    private String swiperId; // Person who swiped
    private String swiperName;
    private String swiperAvatar;
    private String roomId;
    private String roomTitle;
    private String roomImageUrl;
    private Boolean isMatch; // true if both swiped right
    private String conversationId; // Only if isMatch = true
}