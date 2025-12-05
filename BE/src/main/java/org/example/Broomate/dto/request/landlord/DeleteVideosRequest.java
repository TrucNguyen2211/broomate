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
@Schema(description = "Request to delete videos from a room")
public class DeleteVideosRequest {

    @NotEmpty(message = "Video URLs list cannot be empty")
    @Schema(
            description = "List of video URLs to delete",
            example = "[\"https://dzysmnulhfhvownkvoct.supabase.co/storage/v1/object/sign/SEPM/videos/video1.mp4?token=...\", \"https://dzysmnulhfhvownkvoct.supabase.co/storage/v1/object/sign/SEPM/videos/video2.mp4?token=...\"]",
            required = true
    )
    private List<String> videoUrls;
}