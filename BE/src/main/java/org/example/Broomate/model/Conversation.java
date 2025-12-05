package org.example.Broomate.model;

import com.google.cloud.Timestamp;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Conversation extends BaseModel {

    private List<String> participantIds;  // [tenant1Id, tenant2Id] or [tenant1Id, tenant2Id, landlordId]
    private String lastMessage;
    private Timestamp lastMessageAt;

    // Note: type and relatedRoomId are optional fields for future use
    // Not in original spec but useful for distinguishing conversation types
}
