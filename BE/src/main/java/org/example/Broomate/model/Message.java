package org.example.Broomate.model;


import lombok.Data;
import lombok.EqualsAndHashCode;

import lombok.AllArgsConstructor;

import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Message extends BaseModel {

    private String conversationId;
    private String senderId;
    private String content;
    private List<String> mediaUrls;
    private List<String> readBy;  // List of user IDs who read the message

    // Note: createdAt from BaseModel serves as "timestamp"
}