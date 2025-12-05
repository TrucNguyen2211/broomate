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
public class Swipe extends BaseModel {

    private String swiperId;    // Tenant who swiped
    private String targetId;    // Tenant being viewed
    private SwipeActionEnum action;

    // Note: createdAt from BaseModel serves as "swipedAt"

    public enum SwipeActionEnum {
        ACCEPT,
        REJECT
    }
}