package org.example.Broomate.dto.websocket;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage {
    private String type; // "NEW_MESSAGE" or "NEW_SWIPE"
    private String timestamp;
}
