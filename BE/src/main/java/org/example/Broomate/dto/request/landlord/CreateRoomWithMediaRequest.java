package org.example.Broomate.dto.request.landlord;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Setter
@Getter
@Schema(description = "Request wrapper for creating room with media files")
public class CreateRoomWithMediaRequest {

    @Schema(
            description = "Room details in JSON format",
            implementation = CreateRoomRequestJSON.class
//            type = "string",
//            format = "json"
    )
    private CreateRoomRequestJSON request;

    @Schema(description = "Thumbnail image file", type = "string", format = "binary")
    private MultipartFile thumbnail;

    @Schema(description = "Room images", type = "array", format = "binary")
    private List<MultipartFile> images;

    @Schema(description = "Room videos", type = "array", format = "binary")
    private List<MultipartFile> videos;

    @Schema(description = "Room documents (PDF, Word, Excel)", type = "array", format = "binary")
    private List<MultipartFile> documents;

}