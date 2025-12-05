package org.example.Broomate.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.Broomate.dto.request.guest.LoginRequest;
import org.example.Broomate.dto.request.guest.SignupLandlordRequest;
import org.example.Broomate.dto.request.guest.SignupTenantRequest;
import org.example.Broomate.dto.response.ErrorResponse;
import org.example.Broomate.dto.response.guest.AuthResponse;
import org.example.Broomate.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Public APIs for guest users (login & signup)")
@RequiredArgsConstructor
public class GuestAuthController {

    private final AuthService authService;

    // ========================================
    // LOGIN (No changes needed)
    // ========================================
    @Operation(summary = "Login",
            description = "Authenticate user with email and password, returns JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }



        // ========================================
        // TENANT SIGNUP
        // ========================================
        @Operation(
                summary = "Sign up as Tenant",
                description = "Register a new tenant account with preferences and optional avatar. " +
                        "You can update your preferences later in settings."
        )
        @ApiResponses(value = {
                @ApiResponse(responseCode = "201", description = "Tenant registered successfully",
                        content = @Content(mediaType = "application/json",
                                schema = @Schema(implementation = AuthResponse.class))),
                @ApiResponse(responseCode = "400", description = "Invalid request or validation error",
                        content = @Content(mediaType = "application/json",
                                schema = @Schema(implementation = ErrorResponse.class))),
                @ApiResponse(responseCode = "409", description = "Email already exists",
                        content = @Content(mediaType = "application/json",
                                schema = @Schema(implementation = ErrorResponse.class)))
        })
        @PostMapping(value = "/signup/tenant", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<AuthResponse> signupTenant(
                // Basic info
                @Parameter(description = "Email address", required = true, example = "tenant@example.com")
                @RequestParam String email,

                @Parameter(description = "Password (min 8 characters)", required = true)
                @RequestParam String password,

                @Parameter(description = "Confirm password", required = true)
                @RequestParam String confirmPassword,

                @Parameter(description = "Full name", required = true, example = "John Doe")
                @RequestParam String name,

                @Parameter(description = "Phone number", example = "0901234567")
                @RequestParam(required = false) String phone,

                @Parameter(description = "Profile description", example = "Looking for a quiet place")
                @RequestParam(required = false) String description,

                // Human preferences
                @Parameter(description = "Age (18-100)", example = "25")
                @RequestParam(required = false) Integer age,

                @Parameter(description = "Gender", example = "MALE")
                @RequestParam(required = false) String gender,

                @Parameter(description = "Stay length in months", example = "6")
                @RequestParam(required = false) Integer stayLengthMonths,

                @Parameter(description = "Move-in date (YYYY-MM-DD)", example = "2025-01-15")
                @RequestParam(required = false) String moveInDate,

                @Parameter(description = "Is smoker", example = "false")
                @RequestParam(required = false, defaultValue = "false") boolean smoking,

                @Parameter(description = "Cooks regularly", example = "true")
                @RequestParam(required = false, defaultValue = "false") boolean cooking,

                // Room preferences
                @Parameter(description = "Monthly budget in VND", example = "5000000")
                @RequestParam(required = false) Double budgetPerMonth,

                @Parameter(description = "Preferred districts")
                @RequestParam(required = false) java.util.List<String> preferredDistricts,

                @Parameter(description = "Needs window/balcony", example = "true")
                @RequestParam(required = false, defaultValue = "false") boolean needWindow,

                @Parameter(description = "Needs washing machine", example = "true")
                @RequestParam(required = false, defaultValue = "false") boolean needWashingMachine,

                @Parameter(description = "Willing to share bedroom", example = "false")
                @RequestParam(required = false, defaultValue = "false") boolean mightShareBedRoom,

                @Parameter(description = "Willing to share toilet", example = "true")
                @RequestParam(required = false, defaultValue = "false") boolean mightShareToilet,

                @Parameter(description = "Optional avatar image")
                @RequestPart(value = "avatar", required = false) MultipartFile avatar
        ) throws IOException {

            // Build request object
            SignupTenantRequest request = SignupTenantRequest.builder()
                    .email(email)
                    .password(password)
                    .confirmPassword(confirmPassword)
                    .name(name)
                    .phone(phone)
                    .description(description)
                    .age(age)
                    .gender(gender)
                    .stayLengthMonths(stayLengthMonths)
                    .moveInDate(moveInDate)
                    .smoking(smoking)
                    .cooking(cooking)
                    .budgetPerMonth(budgetPerMonth)
                    .preferredDistricts(preferredDistricts)
                    .needWindow(needWindow)
                    .needWashingMachine(needWashingMachine)
                    .mightShareBedRoom(mightShareBedRoom)
                    .mightShareToilet(mightShareToilet)
                    .build();

            AuthResponse response = authService.signupTenant(request, avatar);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        // ========================================
        // LANDLORD SIGNUP
        // ========================================
        @Operation(
                summary = "Sign up as Landlord",
                description = "Register a new landlord account with optional avatar"
        )
        @ApiResponses(value = {
                @ApiResponse(responseCode = "201", description = "Landlord registered successfully",
                        content = @Content(mediaType = "application/json",
                                schema = @Schema(implementation = AuthResponse.class))),
                @ApiResponse(responseCode = "400", description = "Invalid request or validation error",
                        content = @Content(mediaType = "application/json",
                                schema = @Schema(implementation = ErrorResponse.class))),
                @ApiResponse(responseCode = "409", description = "Email already exists",
                        content = @Content(mediaType = "application/json",
                                schema = @Schema(implementation = ErrorResponse.class)))
        })
        @PostMapping(value = "/signup/landlord", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<AuthResponse> signupLandlord(
                @Parameter(description = "Email address", required = true, example = "landlord@example.com")
                @RequestParam String email,

                @Parameter(description = "Password (min 8 characters)", required = true)
                @RequestParam String password,

                @Parameter(description = "Confirm password", required = true)
                @RequestParam String confirmPassword,

                @Parameter(description = "Full name", required = true, example = "Jane Smith")
                @RequestParam String name,

                @Parameter(description = "Phone number", example = "0901234567")
                @RequestParam(required = false) String phone,

                @Parameter(description = "Profile description", example = "Experienced landlord")
                @RequestParam(required = false) String description,

                @Parameter(description = "Optional avatar image")
                @RequestPart(value = "avatar", required = false) MultipartFile avatar
        ) throws IOException {

            // Build request object
            SignupLandlordRequest request = SignupLandlordRequest.builder()
                    .email(email)
                    .password(password)
                    .confirmPassword(confirmPassword)
                    .name(name)
                    .phone(phone)
                    .description(description)
                    .build();

            AuthResponse response = authService.signupLandlord(request, avatar);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
    }
