package org.example.Broomate;

import org.example.Broomate.config.SupabaseConfig;
import org.example.Broomate.service.FileStorageService;
import org.example.Broomate.service.FileValidationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceTest {

    @Mock
    private SupabaseConfig supabaseConfig;

    @Mock
    private FileValidationService fileValidationService;

    @InjectMocks
    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        // Setup any common test data
    }

    @Test
    void testUploadFile_ShouldFailWhenFileTooLarge() {
        // Arrange
        byte[] largeFileContent = new byte[200 * 1024 * 1024]; // 200 MB
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large-video.mp4",
                "video/mp4",
                largeFileContent
        );

        // Mock validation to throw exception for oversized file
        doThrow(new IllegalArgumentException("File size exceeds maximum allowed size of 100MB"))
                .when(fileValidationService)
                .validateImage(any(MultipartFile.class));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> fileStorageService.uploadFile(largeFile, "images")
        );

        // Verify
        assertEquals("File size exceeds maximum allowed size of 100MB", exception.getMessage());
        verify(fileValidationService, times(1)).validateImage(largeFile);

        System.out.println("✅ Test Case 1 Passed: File upload failed with oversized file");
        System.out.println("   Error Message: " + exception.getMessage());
    }


}