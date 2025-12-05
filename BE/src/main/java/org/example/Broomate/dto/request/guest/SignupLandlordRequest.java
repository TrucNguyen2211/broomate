package org.example.Broomate.dto.request.guest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Landlord signup request")
public class SignupLandlordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "Email address", example = "landlord@example.com")
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
    @Schema(description = "Full name", example = "Jane Smith")
    private String name;

    @Schema(description = "Phone number", example = "0901234567")
    private String phone;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Schema(description = "Profile description", example = "Experienced landlord with multiple properties")
    private String description;
}