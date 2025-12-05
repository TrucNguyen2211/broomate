package org.example.Broomate.dto.request.tenant;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.example.Broomate.model.Swipe;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwipeRequest {
    
    @NotNull(message = "Target tenant ID is required")
    private String targetTenantId;
    
    @NotNull(message = "Swipe action is required")
    // ✅ Remove @Pattern - validation happens automatically with Enum
    private Swipe.SwipeActionEnum swipeAction;
}