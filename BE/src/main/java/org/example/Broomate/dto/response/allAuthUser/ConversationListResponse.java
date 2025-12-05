package org.example.Broomate.dto.response.allAuthUser;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Conversation list response")
public class ConversationListResponse {

    @Schema(description = "List of conversations")
    private List<ConversationDetailResponse> conversations;

    @Schema(description = "Total count", example = "15")
    private Integer totalCount;

    @Schema(description = "Message", example = "Conversations retrieved successfully")
    private String message;
}