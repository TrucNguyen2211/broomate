package org.example.Broomate.dto.request.allAuthUser;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarkAsReadRequest {
    
    @Schema(description = "List of message IDs to mark as read")
    private List<String> messageIds;
}
