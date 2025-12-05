package org.example.Broomate.dto.response.allAuthUser;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomStatsResponse {
    
    @Schema(description = "Total number of rooms", example = "15")
    private Long totalRooms;
    
    @Schema(description = "Number of published rooms", example = "12")
    private Long publishedRooms;
    
    @Schema(description = "Number of draft rooms", example = "3")
    private Long draftRooms;
    
    @Schema(description = "Number of rented rooms", example = "5")
    private Long rentedRooms;
    
    @Schema(description = "Total views across all rooms", example = "1250")
    private Long totalViews;
    
    @Schema(description = "Total inquiries across all rooms", example = "45")
    private Long totalInquiries;
    
    @Schema(description = "Average views per room", example = "83.33")
    private Double averageViewsPerRoom;
}
