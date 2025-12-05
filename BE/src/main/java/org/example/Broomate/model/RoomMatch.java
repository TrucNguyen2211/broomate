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
public class RoomMatch extends BaseModel {

    private String roomId;
    private String tenant1Id;
    private String tenant2Id;
    private String conversationId;
    private RoomMatchStatus status;

    // Note: createdAt from BaseModel serves as "matchedAt"

    public enum RoomMatchStatus {
        PENDING,
        CONFIRMED,
        CANCELLED
    }
}