package org.example.Broomate.model;


import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class Match extends BaseModel {

    private String tenant1Id;
    private String tenant2Id;
    private String conversationId;
    private MatchStatusEnum status;

    public enum MatchStatusEnum {
        ACTIVE,
        INACTIVE,
        BLOCKED
    }
}