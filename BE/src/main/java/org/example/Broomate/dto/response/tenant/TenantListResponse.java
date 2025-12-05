package org.example.Broomate.dto.response.tenant;

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
public class TenantListResponse {
    
    @Schema(description = "List of tenants")
    private List<TenantProfileResponse> tenants;
    
    @Schema(description = "Total number of tenants", example = "50")
    private int totalCount;

    @Schema (description = "Message")
    private String message;
    

}
