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
@Schema(description = "Room list response")
public class RoomListResponse {

    @Schema(description = "List of rooms")
    private List<RoomDetailResponse> rooms;

    @Schema(description = "Total count", example = "50")
    private Integer totalCount;

    @Schema(description = "Message", example = "Rooms retrieved successfully")
    private String message;
}
