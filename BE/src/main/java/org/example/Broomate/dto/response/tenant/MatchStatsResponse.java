package org.example.Broomate.dto.response.tenant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchStatsResponse {
    
    @Schema(description = "Total number of swipes", example = "50")
    private Long totalSwipes;
    
    @Schema(description = "Number of right swipes (accepts)", example = "15")
    private Long rightSwipes;
    
    @Schema(description = "Number of left swipes (rejects)", example = "35")
    private Long leftSwipes;
    
    @Schema(description = "Number of matches", example = "8")
    private Long totalMatches;
    
    @Schema(description = "Number of active matches", example = "5")
    private Long activeMatches;
    
    @Schema(description = "Match rate percentage", example = "53.33")
    private Double matchRate;
    
    @Schema(description = "Average swipes per day", example = "5.2")
    private Double averageSwipesPerDay;
}
