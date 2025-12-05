package org.example.Broomate.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    
    @Schema(description = "Error message", example = "Resource not found")
    private String message;
    
    @Schema(description = "Error code", example = "ERR_001")
    private String code;
    
    @Schema(description = "Timestamp of error", example = "2024-01-15T10:30:00Z")
    private String timestamp;
}
