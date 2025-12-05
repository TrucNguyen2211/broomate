package org.example.Broomate.dto.request.allAuthUser;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Send message request")
public class SendMessageRequest {

    @NotBlank(message = "Message content is required")
    @Size(min = 1, max = 5000, message = "Message must be between 1 and 5000 characters")
    @Schema(description = "Message content", example = "Hello, is this room still available?")
    private String content;

    // Removed mediaUrls - we'll upload the file instead
}