package org.example.Broomate.model;


import com.google.cloud.firestore.annotation.DocumentId;
import lombok.*;

import java.io.Serializable;
import com.google.cloud.Timestamp;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class BaseModel implements Serializable {

    @DocumentId  // Firebase will auto-generate this
    private String id;

    private Timestamp createdAt;
    private Timestamp updatedAt;


}