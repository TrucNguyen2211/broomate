package org.example.Broomate.dto.response.tenant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.Broomate.dto.response.allAuthUser.ConversationDetailResponse;
import org.example.Broomate.dto.response.allAuthUser.RoomDetailResponse;
import org.example.Broomate.model.Bookmark;
import org.example.Broomate.model.Room;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Bookmark response with optional room details and 3-way conversation")
public class BookmarkResponse {

    @Schema(description = "Bookmark ID", example = "bookmark-123")
    private String id;

    @Schema(description = "Room ID", example = "room-456")
    private String roomId;

    @Schema(description = "Bookmarked at timestamp", example = "2025-11-05T10:30:00Z")
    private String bookmarkedAt;

    @Schema(description = "Room details (included when fetching all bookmarks)")
    private RoomDetailResponse room;

    // ✅ NEW FIELDS
    @Schema(description = "Whether a 3-way conversation was created with matched tenant and landlord")
    private Boolean threeWayConversationCreated;

    @Schema(description = "3-way conversation details if created")
    private ConversationDetailResponse threeWayConversation;

    @Schema(description = "Matched tenant who also bookmarked this room")
    private String matchedTenantId;

    @Schema(description = "Matched tenant name")
    private String matchedTenantName;

    @Schema(description = "Response message")
    private String message;

    /**
     * Create response without room details (for bookmark/unbookmark actions)
     */
    public static BookmarkResponse fromBookmark(Bookmark bookmark) {
        return BookmarkResponse.builder()
                .id(bookmark.getId())
                .roomId(bookmark.getRoomId())
                .bookmarkedAt(bookmark.getCreatedAt() != null ?
                        bookmark.getCreatedAt().toString() : null)
                .room(null)
                .threeWayConversationCreated(false)
                .threeWayConversation(null)
                .matchedTenantId(null)
                .matchedTenantName(null)
                .message("Room bookmarked successfully")
                .build();
    }

    /**
     * Create response with 3-way conversation details
     */
    public static BookmarkResponse fromBookmarkWithThreeWayConversation(
            Bookmark bookmark,
            ConversationDetailResponse conversation,
            String matchedTenantId,
            String matchedTenantName
    ) {
        return BookmarkResponse.builder()
                .id(bookmark.getId())
                .roomId(bookmark.getRoomId())
                .bookmarkedAt(bookmark.getCreatedAt() != null ?
                        bookmark.getCreatedAt().toString() : null)
                .room(null)
                .threeWayConversationCreated(true)
                .threeWayConversation(conversation)
                .matchedTenantId(matchedTenantId)
                .matchedTenantName(matchedTenantName)
                .message("Room bookmarked! A 3-way conversation has been created with " +
                        matchedTenantName + " and the landlord.")
                .build();
    }

    /**
     * Create response with room details (for listing bookmarks)
     */
    public static BookmarkResponse fromBookmarkWithRoom(Bookmark bookmark, Room room) {
        return BookmarkResponse.builder()
                .id(bookmark.getId())
                .roomId(bookmark.getRoomId())
                .bookmarkedAt(bookmark.getCreatedAt() != null ?
                        bookmark.getCreatedAt().toString() : null)
                .room(RoomDetailResponse.fromRoom(room))
                .threeWayConversationCreated(false)
                .threeWayConversation(null)
                .matchedTenantId(null)
                .matchedTenantName(null)
                .message(null)
                .build();
    }
}