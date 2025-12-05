package org.example.Broomate.dto.request.landlord;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to delete images from a room")
public class DeleteImagesRequest {

    @NotEmpty(message = "Image URLs list cannot be empty")
    @Schema(
            description = "List of image URLs to delete",
            example = "[\"https://dzysmnulhfhvownkvoct.supabase.co/storage/v1/object/sign/SEPM/images/image1.jpeg?token=...\", \"https://dzysmnulhfhvownkvoct.supabase.co/storage/v1/object/sign/SEPM/images/image2.jpeg?token=...\"]",
            required = true
    )
    private List<String> imageUrls;
}