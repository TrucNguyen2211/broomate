package org.example.Broomate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor  // ✅ Add this for @Builder to work properly
@Builder
public class HTTPMessageResponse {
    private String message;  // ✅ Make it private
}