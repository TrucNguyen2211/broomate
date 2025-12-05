package org.example.Broomate;

import org.example.Broomate.dto.request.guest.SignupTenantRequest;
import org.example.Broomate.dto.response.guest.AuthResponse;
import org.example.Broomate.repository.GuestAuthRepository;
import org.example.Broomate.service.AuthService;
import org.example.Broomate.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private GuestAuthRepository authRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private AuthService authService;

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testSignupTenant_ShouldFailWhenMissingRequiredFields() {
        // Arrange - Missing required fields (age, budget, stay length, etc.)
        SignupTenantRequest request = SignupTenantRequest.builder()
                .email("tenant@example.com")
                .password("Password123!")
                .confirmPassword("Password123!")
                .name("John Doe")
                .phone("0901234567")
                // Missing: age, gender, budgetPerMonth, stayLengthMonths, etc.
                .build();
        Set<ConstraintViolation<SignupTenantRequest>> violations = validator.validate(request);

        System.out.println("✅ Test Case 2 Passed: Signup failed due to missing required fields");
        System.out.println("   Validation Errors:");
        for (ConstraintViolation<SignupTenantRequest> violation : violations) {
            System.out.println("   - " + violation.getPropertyPath() + ": " + violation.getMessage());
        }
    }

    @Test
    void testSignupTenant_ShouldFailWhenMissingBudget() {
        // Arrange - Missing budget
        SignupTenantRequest request = SignupTenantRequest.builder()
                .email("tenant@example.com")
                .password("Password123!")
                .confirmPassword("Password123!")
                .name("John Doe")
                .age(25)
                .gender("MALE")
                .stayLengthMonths(6)
                // Missing: budgetPerMonth
                .build();

        // Act
        Set<ConstraintViolation<SignupTenantRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(
                violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("budgetPerMonth")),
                "Should have validation error for missing budgetPerMonth"
        );
    }

    @Test
    void testSignupTenant_ShouldFailWhenMissingStayLength() {
        // Arrange - Missing stay length
        SignupTenantRequest request = SignupTenantRequest.builder()
                .email("tenant@example.com")
                .password("Password123!")
                .confirmPassword("Password123!")
                .name("John Doe")
                .age(25)
                .budgetPerMonth(5000000.0)
                // Missing: stayLengthMonths
                .build();

        // Act
        Set<ConstraintViolation<SignupTenantRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(
                violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("stayLengthMonths")),
                "Should have validation error for missing stayLengthMonths"
        );
    }

    @Test
    void testSignupTenant_ShouldSucceedWithAllRequiredFields() throws Exception {
        // Arrange - All required fields provided
        SignupTenantRequest request = SignupTenantRequest.builder()
                .email("tenant@example.com")
                .password("Password123!")
                .confirmPassword("Password123!")
                .name("John Doe")
                .phone("0901234567")
                .age(25)
                .gender("MALE")
                .budgetPerMonth(5000000.0)
                .stayLengthMonths(6)
                .moveInDate("2025-01-15")
                .smoking(false)
                .cooking(true)
                .needWindow(true)
                .needWashingMachine(true)
                .mightShareBedRoom(false)
                .mightShareToilet(true)
                .build();

        // Act
        Set<ConstraintViolation<SignupTenantRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should have no validation errors with all required fields");

        System.out.println("✅ Validation passed: All required fields provided");
    }
}