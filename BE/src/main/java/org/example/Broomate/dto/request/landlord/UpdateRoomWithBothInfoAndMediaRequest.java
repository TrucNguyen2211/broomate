package org.example.Broomate.dto.request.landlord;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.Broomate.model.Room;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update room with both info and media files")
public class UpdateRoomWithBothInfoAndMediaRequest {

    // Basic room information
    @NotBlank(message = "Title is required")
    @Schema(description = "Room title", example = "Cozy 2BR Apartment")
    private String title;

    @Schema(description = "Room description")
    private String description;

    @NotNull(message = "Rent price is required")
    @Positive(message = "Rent price must be positive")
    @Schema(description = "Monthly rent price", example = "5000000")
    private Double rentPricePerMonth;

    @NotNull(message = "Minimum stay is required")
    @Min(value = 1, message = "Minimum stay must be at least 1 month")
    @Schema(description = "Minimum stay in months", example = "6")
    private Integer minimumStayMonths;

    @NotBlank(message = "Address is required")
    @Schema(description = "Room address")
    private String address;

    @Schema(description = "Latitude coordinate", example = "10.7769")
    private Double latitude;

    @Schema(description = "Longitude coordinate", example = "106.7009")
    private Double longitude;

    @NotNull(message = "Number of toilets is required")
    @Min(value = 1)
    @Schema(description = "Number of toilets", example = "2")
    private Integer numberOfToilets;

    @NotNull(message = "Number of bedrooms is required")
    @Min(value = 1)
    @Schema(description = "Number of bedrooms", example = "2")
    private Integer numberOfBedRooms;

    @NotNull(message = "Window information is required")
    @Schema(description = "Has window", example = "true")
    private Boolean hasWindow;

    @Schema(description = "Room status", example = "PUBLISHED")
    private Room.RoomStatus status;

    // Media files to remove (URLs)
    @Schema(description = "URLs of images to delete",
            example = "[\"https://supabase.co/storage/.../image1.jpg\"]")
    private List<String> imagesToRemove;

    @Schema(description = "URLs of videos to delete")
    private List<String> videosToRemove;

    @Schema(description = "URLs of documents to delete")
    private List<String> documentsToRemove;

    @Schema(description = "Set to true to replace/remove thumbnail")
    private Boolean replaceThumbnail;
}