package org.example.Broomate.dto.response.allAuthUser;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.Broomate.model.Room;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Room response")
public class RoomDetailResponse {

    @Schema(description = "Room ID", example = "room123")
    private String id;

    @Schema(description = "Landlord ID", example = "landlord456")
    private String landlordId;

    @Schema(description = "Room title", example = "Spacious 2BR Apartment")
    private String title;

    @Schema(description = "Room description")
    private String description;

    @Schema(description = "Thumbnail URL")
    private String thumbnailUrl;

    @Schema(description = "Image URLs")
    private List<String> imageUrls;

    @Schema(description = "Video URLs")
    private List<String> videoUrls;

    @Schema(description = "Document URLs")
    private List<String> documentUrls;

    @Schema(description = "Rent price per month", example = "5000000")
    private Double rentPricePerMonth;

    @Schema(description = "Minimum stay in months", example = "6")
    private Integer minimumStayMonths;

    @Schema(description = "Address")
    private String address;

    @Schema(description = "Latitude", example = "10.7769")
    private Double latitude;

    @Schema(description = "Longitude", example = "106.7009")
    private Double longitude;

    @Schema(description = "Number of toilets", example = "2")
    private Integer numberOfToilets;

    @Schema(description = "Number of bedrooms", example = "2")
    private Integer numberOfBedRooms;

    @Schema(description = "Has window", example = "true")
    private boolean hasWindow;

    @Schema(description = "Room status", example = "PUBLISHED")
    private Room.RoomStatus status;

    @Schema(description = "Created timestamp")
    private String createdAt;

    @Schema(description = "Updated timestamp")
    private String updatedAt;

    /**
     * Convert Room model to RoomResponse DTO
     */
    public static RoomDetailResponse fromRoom(Room room) {
        return RoomDetailResponse.builder()
                .id(room.getId())
                .landlordId(room.getLandlordId())
                .title(room.getTitle())
                .description(room.getDescription())
                .thumbnailUrl(room.getThumbnailUrl())
                .imageUrls(room.getImageUrls())
                .videoUrls(room.getVideoUrls())
                .documentUrls(room.getDocumentUrls())
                .rentPricePerMonth(room.getRentPricePerMonth())
                .minimumStayMonths(room.getMinimumStayMonths())
                .address(room.getAddress())
                .latitude(room.getLatitude())
                .longitude(room.getLongitude())
                .numberOfToilets(room.getNumberOfToilets())
                .numberOfBedRooms(room.getNumberOfBedRooms())
                .hasWindow(room.isHasWindow())
                .status(room.getStatus())
                .createdAt(room.getCreatedAt() != null ? room.getCreatedAt().toString() : null)
                .updatedAt(room.getUpdatedAt() != null ? room.getUpdatedAt().toString() : null)
                .build();
    }
}