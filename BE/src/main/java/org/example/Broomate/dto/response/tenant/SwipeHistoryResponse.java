package org.example.Broomate.dto.response.tenant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SwipeHistoryResponse {
    
    @Schema(description = "List of swipe actions")
    private List<SwipeResponse> swipes;
    
    @Schema(description = "Total number of swipes", example = "25")
    private Long totalElements;
    
    @Schema(description = "Total number of pages", example = "2")
    private Integer totalPages;
    
    @Schema(description = "Current page number", example = "0")
    private Integer currentPage;
    
    @Schema(description = "Page size", example = "20")
    private Integer pageSize;
}
