package org.example.Broomate.dto.response.guest;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.Broomate.model.Account;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Authentication response with JWT token")
public class AuthResponse {

    @Schema(description = "JWT access token", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String token;

    @Schema(description = "User ID", example = "user123")
    private String userId;

    @Schema(description = "User email", example = "user@example.com")
    private String email;

    @Schema(description = "User name", example = "John Doe")
    private String name;

    @Schema(description = "User role", example = "TENANT")
    private Account.AccountRoleEnum role;

    @Schema(description = "Avatar URL (if uploaded during signup)")
    private String avatarUrl;

    @Schema(description = "Response message", example = "Login successful")
    private String message;
}