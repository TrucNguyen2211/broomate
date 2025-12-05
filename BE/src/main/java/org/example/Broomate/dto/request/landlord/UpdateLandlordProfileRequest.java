package org.example.Broomate.dto.request.landlord;

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
@Schema(description = "Request to update landlord profile")
public class UpdateLandlordProfileRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Schema(description = "Landlord name", example = "John Smith")
    private String name;

    @Schema(description = "Phone number", example = "0901234567")
    private String phone;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Schema(description = "Profile description", example = "Experienced landlord with 10+ properties")
    private String description;

    @Schema(description = "Set to true to remove current avatar")
    private Boolean removeAvatar;
}