package org.example.Broomate.dto.response.tenant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Match details")
public class MatchResponse {

    @Schema(description = "Match ID", example = "match123")
    private String matchId;

    @Schema(description = "Conversation ID", example = "conv456")
    private String conversationId;

    @Schema(description = "Other tenant's ID", example = "tenant789")
    private String otherTenantId;

    @Schema(description = "Other tenant's name", example = "Jane Smith")
    private String otherTenantName;

    @Schema(description = "Other tenant's avatar URL", example = "https://example.com/avatar.jpg")
    private String otherTenantAvatar;

    @Schema(description = "When the match was created", example = "2025-10-24T12:30:00Z")
    private String matchedAt;
}