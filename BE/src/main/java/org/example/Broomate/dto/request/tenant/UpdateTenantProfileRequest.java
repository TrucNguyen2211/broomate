package org.example.Broomate.dto.request.tenant;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to update tenant profile")
public class UpdateTenantProfileRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Schema(description = "Tenant name", example = "John Doe")
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Schema(description = "Profile description", example = "Looking for a quiet place near District 1")
    private String description;

    @Positive(message = "Budget must be positive")
    @Schema(description = "Monthly budget", example = "5000000")
    private Double budgetPerMonth;

    @Min(value = 1, message = "Stay length must be at least 1 month")
    @Schema(description = "Desired stay length in months", example = "6")
    private Integer stayLength;

    @Schema(description = "Preferred move-in date", example = "2025-01-01")
    private String moveInDate;

    @Schema(description = "Preferred districts/locations", example = "[\"District 1\", \"District 3\"]")
    private List<String> preferredLocations;

    @Schema(description = "Phone number", example = "0901234567")
    private String phone;

    @Min(value = 18, message = "Age must be at least 18")
    @Max(value = 100, message = "Age must be less than 100")
    @Schema(description = "Age", example = "25")
    private Integer age;

    @Schema(description = "Gender", example = "MALE", allowableValues = {"MALE", "FEMALE", "OTHER"})
    private String gender;

    @Schema(description = "Is smoker", example = "false")
    private boolean smoking;

    @Schema(description = "Cooks regularly", example = "true")
    private boolean cooking;

    @Schema(description = "Needs window", example = "true")
    private boolean needWindow;

    @Schema(description = "Willing to share bedroom", example = "false")
    private boolean mightShareBedRoom;

    @Schema(description = "Willing to share toilet", example = "true")
    private boolean mightShareToilet;

    @Schema(description = "Set to true to remove current avatar")
    private Boolean removeAvatar;
}