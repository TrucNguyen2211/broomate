package org.example.Broomate.service;

import com.google.cloud.Timestamp;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.Broomate.config.JwtUtil;
import org.example.Broomate.dto.request.guest.LoginRequest;
import org.example.Broomate.dto.request.guest.SignupLandlordRequest;
import org.example.Broomate.dto.request.guest.SignupTenantRequest;
import org.example.Broomate.dto.response.guest.AuthResponse;
import org.example.Broomate.model.Account;
import org.example.Broomate.model.Landlord;
import org.example.Broomate.model.Tenant;
import org.example.Broomate.repository.GuestAuthRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final GuestAuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final FileStorageService fileStorageService;

    // ========================================
    // 1. LOGIN - ✅ FIXED: Auto-reactivate deactivated accounts
    // ========================================
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        // 1. Find user by email
        Account account = authRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with email: " + request.getEmail()
                ));

        // 2. ✅ AUTO-REACTIVATE: Instead of blocking, reactivate deactivated accounts
        if (!account.isActive()) {
            log.info("Auto-reactivating deactivated account for user: {}", account.getId());
            account.setActive(true);
            account.setUpdatedAt(Timestamp.now());
            
            // Save the updated account based on role
            if (account.getRole() == Account.AccountRoleEnum.TENANT) {
                authRepository.saveTenant((Tenant) account);
            } else if (account.getRole() == Account.AccountRoleEnum.LANDLORD) {
                authRepository.saveLandlord((Landlord) account);
            }
            
            log.info("Account reactivated successfully for user: {}", account.getId());
        }

        // 3. Authenticate with Spring Security
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        // 4. Load user details and generate JWT
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String jwt = jwtUtil.generateToken(
                account.getEmail(),
                account.getId(),
                account.getRole().toString()
        );

        log.info("Login successful for email: {}", request.getEmail());

        // 5. Return response with token
        return AuthResponse.builder()
                .token(jwt)
                .userId(account.getId())
                .email(account.getEmail())
                .name(account.getName())
                .role(account.getRole())
                .message("Login successful")
                .build();
    }

    // ========================================
// TENANT SIGNUP
// ========================================
    public AuthResponse signupTenant(SignupTenantRequest request, MultipartFile avatar) throws IOException {
        log.info("Tenant signup attempt for email: {}", request.getEmail());

        String uploadedAvatarUrl = null;

        try {
            // 1. Check if email already exists
            if (authRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Email already registered: " + request.getEmail()
                );
            }

            // 2. Validate password confirmation
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Passwords do not match"
                );
            }

            // 3. Upload avatar (if provided)
            if (avatar != null && !avatar.isEmpty()) {
                uploadedAvatarUrl = fileStorageService.uploadFile(avatar, "avatars");
                log.info("Avatar uploaded successfully: {}", uploadedAvatarUrl);
            }

            // 4. Hash password
            String hashedPassword = passwordEncoder.encode(request.getPassword());

            // 5. Create Tenant with all preferences
            String userId = UUID.randomUUID().toString();
            Tenant tenant = Tenant.builder()
                    .id(userId)
                    .email(request.getEmail())
                    .password(hashedPassword)
                    .name(request.getName())
                    .phone(request.getPhone())
                    .avatarUrl(uploadedAvatarUrl)
                    .description(request.getDescription())
                    .role(Account.AccountRoleEnum.TENANT)
                    .active(true)
                    // Human preferences
                    .age(request.getAge())
                    .gender(Tenant.GenderEnum.valueOf(request.getGender()))
                    .stayLengthMonths(request.getStayLengthMonths())
                    .moveInDate(request.getMoveInDate())
                    .isSmoking(request.isSmoking())
                    .isCooking(request.isCooking())
                    // Room preferences
                    .budgetPerMonth(request.getBudgetPerMonth())
                    .preferredDistricts(request.getPreferredDistricts())
                    .needWindow(request.isNeedWindow())
                    .mightShareBedRoom(request.isMightShareBedRoom())
                    .mightShareToilet(request.isMightShareToilet())
                    .createdAt(Timestamp.now())
                    .updatedAt(Timestamp.now())
                    .build();

            Account account = authRepository.saveTenant(tenant);
            log.info("Tenant account created: {}", userId);

            // 6. Generate JWT token
            String jwt = jwtUtil.generateToken(
                    account.getEmail(),
                    account.getId(),
                    account.getRole().toString()
            );

            log.info("Tenant signup successful for email: {}", request.getEmail());

            return AuthResponse.builder()
                    .token(jwt)
                    .userId(account.getId())
                    .email(account.getEmail())
                    .name(account.getName())
                    .role(account.getRole())
                    .avatarUrl(uploadedAvatarUrl)
                    .message("Tenant account created successfully. You can update your preferences anytime in settings.")
                    .build();

        } catch (Exception e) {
            // ROLLBACK: Delete uploaded avatar if signup fails
            log.error("Tenant signup failed, rolling back uploaded avatar", e);
            if (uploadedAvatarUrl != null) {
                fileStorageService.deleteFile(uploadedAvatarUrl);
            }

            if (e instanceof ResponseStatusException) {
                throw e;
            }
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to create tenant account: " + e.getMessage()
            );
        }
    }

    // ========================================
// LANDLORD SIGNUP
// ========================================
    public AuthResponse signupLandlord(SignupLandlordRequest request, MultipartFile avatar) throws IOException {
        log.info("Landlord signup attempt for email: {}", request.getEmail());

        String uploadedAvatarUrl = null;

        try {
            // 1. Check if email already exists
            if (authRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Email already registered: " + request.getEmail()
                );
            }

            // 2. Validate password confirmation
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Passwords do not match"
                );
            }

            // 3. Upload avatar (if provided)
            if (avatar != null && !avatar.isEmpty()) {
                uploadedAvatarUrl = fileStorageService.uploadFile(avatar, "avatars");
                log.info("Avatar uploaded successfully: {}", uploadedAvatarUrl);
            }

            // 4. Hash password
            String hashedPassword = passwordEncoder.encode(request.getPassword());

            // 5. Create Landlord
            String userId = UUID.randomUUID().toString();
            Landlord landlord = Landlord.builder()
                    .id(userId)
                    .email(request.getEmail())
                    .password(hashedPassword)
                    .name(request.getName())
                    .phone(request.getPhone())
                    .avatarUrl(uploadedAvatarUrl)
                    .description(request.getDescription())
                    .role(Account.AccountRoleEnum.LANDLORD)
                    .active(true)
                    .createdAt(Timestamp.now())
                    .updatedAt(Timestamp.now())
                    .build();

            Account account = authRepository.saveLandlord(landlord);
            log.info("Landlord account created: {}", userId);

            // 6. Generate JWT token
            String jwt = jwtUtil.generateToken(
                    account.getEmail(),
                    account.getId(),
                    account.getRole().toString()
            );

            log.info("Landlord signup successful for email: {}", request.getEmail());

            return AuthResponse.builder()
                    .token(jwt)
                    .userId(account.getId())
                    .email(account.getEmail())
                    .name(account.getName())
                    .role(account.getRole())
                    .avatarUrl(uploadedAvatarUrl)
                    .message("Landlord account created successfully")
                    .build();

        } catch (Exception e) {
            // ROLLBACK: Delete uploaded avatar if signup fails
            log.error("Landlord signup failed, rolling back uploaded avatar", e);
            if (uploadedAvatarUrl != null) {
                fileStorageService.deleteFile(uploadedAvatarUrl);
            }

            if (e instanceof ResponseStatusException) {
                throw e;
            }
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to create landlord account: " + e.getMessage()
            );
        }
    }
}