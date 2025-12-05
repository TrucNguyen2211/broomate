package org.example.Broomate.dto.request.guest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Schema(description = "User email", example = "john@example.com")
    private String email;

    @NotBlank(message = "Password is required")
    @Schema(description = "User password", example = "Password123!")
    private String password;
}
