package org.example.Broomate.dto.request.guest;

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
@Schema(description = "Tenant signup request with preferences")
public class SignupTenantRequest {

    // Basic account info
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "Email address", example = "tenant@example.com")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Schema(description = "Password", example = "Password123!")
    private String password;

    @NotBlank(message = "Password confirmation is required")
    @Schema(description = "Confirm password", example = "Password123!")
    private String confirmPassword;

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Schema(description = "Full name", example = "John Doe")
    private String name;

    @Schema(description = "Phone number", example = "0901234567")
    private String phone;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Schema(description = "Profile description", example = "Looking for a quiet place")
    private String description;

    // Human preference criteria
    @Min(value = 18, message = "Age must be at least 18")
    @Max(value = 100, message = "Age must be less than 100")
    @Schema(description = "Age", example = "25")
    private Integer age;

    @Schema(description = "Gender", example = "MALE", allowableValues = {"MALE", "FEMALE", "OTHER"})
    private String gender;

    @Min(value = 1, message = "Stay length must be at least 1 month")
    @NotNull(message = "Stay length is required")
    @Schema(description = "Desired stay length in months", example = "6")
    private Integer stayLengthMonths;

    @Schema(description = "Preferred move-in date", example = "2025-01-15")
    private String moveInDate;

    @Schema(description = "Is smoker", example = "false")
    private boolean smoking;

    @Schema(description = "Cooks regularly", example = "true")
    private boolean cooking;

    // Room preference criteria
    @NotNull(message = "Budget is required")
    @Positive(message = "Budget must be positive")
    @Schema(description = "Monthly budget in VND", example = "5000000")
    private Double budgetPerMonth;

    @Schema(description = "Preferred districts", example = "[\"District 1\", \"District 3\", \"Binh Thanh\"]")
    private List<String> preferredDistricts;

    @Schema(description = "Needs window or balcony", example = "true")
    private boolean needWindow;

    @Schema(description = "Needs washing machine", example = "true")
    private boolean needWashingMachine;

    @Schema(description = "Willing to share bedroom", example = "false")
    private boolean mightShareBedRoom;

    @Schema(description = "Willing to share toilet", example = "true")
    private boolean mightShareToilet;
}