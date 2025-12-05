package org.example.Broomate.model;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Bookmark extends BaseModel {

    private String tenantId;
    private String roomId;

    // Note: createdAt from BaseModel serves as "bookmarkedAt"
    private String triggeredConversationId; // ID of 3-way conversation if created
}