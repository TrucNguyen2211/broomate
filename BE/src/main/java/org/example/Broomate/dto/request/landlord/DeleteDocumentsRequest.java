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
@Schema(description = "Request to delete documents from a room")
public class DeleteDocumentsRequest {

    @NotEmpty(message = "Document URLs list cannot be empty")
    @Schema(
            description = "List of document URLs to delete",
            example = "[\"https://dzysmnulhfhvownkvoct.supabase.co/storage/v1/object/sign/SEPM/documents/doc1.pdf?token=...\", \"https://dzysmnulhfhvownkvoct.supabase.co/storage/v1/object/sign/SEPM/documents/doc2.docx?token=...\"]",
            required = true
    )
    private List<String> documentUrls;
}