package org.example.Broomate.dto.response.allAuthUser;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageListResponse {
    
    @Schema(description = "List of messages")
    private List<MessageDetailResponse> messages;
    
    @Schema(description = "Total number of messages", example = "150")
    private Long totalElements;
    
    @Schema(description = "Total number of pages", example = "3")
    private Integer totalPages;
    
    @Schema(description = "Current page number", example = "0")
    private Integer currentPage;
    
    @Schema(description = "Page size", example = "50")
    private Integer pageSize;
}
