package org.example.Broomate.dto.response.tenant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.Broomate.model.Tenant;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Tenant profile response")
public class TenantProfileResponse {

    @Schema(description = "Tenant ID", example = "tenant123")
    private String id;

    @Schema(description = "Email address", example = "john@example.com")
    private String email;

    @Schema(description = "Full name", example = "John Doe")
    private String name;

    @Schema(description = "Phone number", example = "0901234567")
    private String phone;

    @Schema(description = "Avatar URL", example = "https://example.com/avatar.jpg")
    private String avatar;

    @Schema(description = "Profile description", example = "25 years old, software engineer")
    private String description;

    @Schema(description = "Monthly budget in VND", example = "5000000")
    private Double budgetPerMonth;

    @Schema(description = "Stay length in months", example = "12")
    private Integer stayLength;

    @Schema(description = "Move-in date", example = "2025-12-01")
    private String moveInDate;

    @Schema(description = "Preferred locations", example = "[\"District 1\", \"District 2\"]")
    private List<String> preferredLocations;

    @Schema(description = "Created timestamp", example = "2025-10-01T10:00:00Z")
    private String createdAt;

    @Schema(description = "Updated timestamp", example = "2025-10-15T14:30:00Z")
    private String updatedAt;

    @Schema(description = "Whether the profile is active", example = "true")
    private Boolean isActive;

    /**
     * Convert Tenant model to TenantProfileResponse DTO
     */
    public static TenantProfileResponse fromTenant(Tenant tenant) {
        return TenantProfileResponse.builder()
                .id(tenant.getId())
                .email(tenant.getEmail())
                .name(tenant.getName())
                .phone(tenant.getPhone())
                .avatar(tenant.getAvatarUrl())
                .description(tenant.getDescription())
                .budgetPerMonth(tenant.getBudgetPerMonth())
                .stayLength(tenant.getStayLengthMonths())
                .moveInDate(tenant.getMoveInDate())
                .preferredLocations(tenant.getPreferredDistricts())
                .createdAt(tenant.getCreatedAt() != null ? tenant.getCreatedAt().toString() : null)
                .updatedAt(tenant.getUpdatedAt() != null ? tenant.getUpdatedAt().toString() : null)
                .isActive(tenant.isActive())
                .build();
    }
}