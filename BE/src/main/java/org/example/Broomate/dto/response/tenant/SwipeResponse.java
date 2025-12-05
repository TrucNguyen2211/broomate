package org.example.Broomate.dto.response.tenant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.example.Broomate.model.Swipe;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public class SwipeResponse {
    
    @Schema(description = "Swipe ID", example = "swipe_123")
    private String swipeId;
    
    @Schema(description = "Target tenant ID", example = "tenant_456")
    private String targetTenantId;
    
    @Schema(description = "Swipe action", example = "ACCEPT")
    private String action;
    
    @Schema(description = "Swiped at timestamp", example = "2024-01-15T10:30:00Z")
    private String swipedAt;

    @Schema(description = "Is match created", example = "false")
    private Boolean isMatch;

    @Schema (description = "Message")
    private String message;
    @Schema(description = "Match details if a match was created")
    private MatchResponse matchDetail;

    public static SwipeResponse fromSwipe(Swipe swipe, boolean isMatch, MatchResponse match, String message) {
        return SwipeResponse.builder()
                .swipeId(swipe.getId())  // ✅ Map correctly
                .targetTenantId(swipe.getTargetId())  // ✅ Map correctly
                .action(swipe.getAction().toString())  // ✅ Map correctly
                .swipedAt(swipe.getCreatedAt() != null ? swipe.getCreatedAt().toString() : null)  // ✅ Map correctly
                .isMatch(isMatch)
                .matchDetail(match)
                .message(message)
                .build();
    }
}
