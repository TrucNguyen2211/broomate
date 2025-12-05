package org.example.Broomate.dto.response.landlord;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.Broomate.model.Landlord;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Landlord profile response")
public class LandlordProfileResponse {

    @Schema(description = "Landlord ID", example = "landlord123")
    private String id;

    @Schema(description = "Email address", example = "john@example.com")
    private String email;

    @Schema(description = "Full name", example = "John Smith")
    private String name;

    @Schema(description = "Phone number", example = "0901234567")
    private String phone;

    @Schema(description = "Avatar URL", example = "https://example.com/avatar.jpg")
    private String avatarUrl;

    @Schema(description = "Profile description", example = "Experienced landlord")
    private String description;

    @Schema(description = "Account role", example = "LANDLORD")
    private String role;

    @Schema(description = "Whether the account is active", example = "true")
    private Boolean isActive;

    @Schema(description = "Created timestamp")
    private String createdAt;

    @Schema(description = "Updated timestamp")
    private String updatedAt;

    /**
     * Convert Landlord model to LandlordProfileResponse DTO
     */
    public static LandlordProfileResponse fromLandlord(Landlord landlord) {
        return LandlordProfileResponse.builder()
                .id(landlord.getId())
                .email(landlord.getEmail())
                .name(landlord.getName())
                .phone(landlord.getPhone())
                .avatarUrl(landlord.getAvatarUrl())
                .description(landlord.getDescription())
                .role(landlord.getRole() != null ? landlord.getRole().toString() : null)
                .isActive(landlord.isActive())
                .createdAt(landlord.getCreatedAt() != null ? landlord.getCreatedAt().toString() : null)
                .updatedAt(landlord.getUpdatedAt() != null ? landlord.getUpdatedAt().toString() : null)
                .build();
    }
}