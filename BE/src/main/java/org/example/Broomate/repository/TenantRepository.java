package org.example.Broomate.repository;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.Broomate.model.*;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Slf4j
@Repository
@RequiredArgsConstructor
public class TenantRepository {

    private static final String TENANTS_COLLECTION = "tenants";
    private static final String SWIPES_COLLECTION = "swipes";
    private static final String MATCHES_COLLECTION = "matches";
    private static final String CONVERSATIONS_COLLECTION = "conversations";
    private final Firestore firestore;

    // ========================================
    // TENANT CRUD OPERATIONS
    // ========================================

    /**
     * Find tenant by ID
     */
    public Optional<Tenant> findById(String tenantId) {
        try {
            DocumentSnapshot document =  firestore
                    .collection(TENANTS_COLLECTION)
                    .document(tenantId)
                    .get()
                    .get();

            if (!document.exists()) {
                return Optional.empty();
            }

            return Optional.ofNullable(document.toObject(Tenant.class));
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding tenant by ID: {}", tenantId, e);
            throw new RuntimeException("Failed to find tenant", e);
        }
    }

    /**
     * Find all active tenants with role TENANT
     */
    public List<Tenant> findAllActiveTenants() {
        try {
            QuerySnapshot querySnapshot = firestore.collection(TENANTS_COLLECTION)
                    .whereEqualTo("role", "TENANT")
                    .whereEqualTo("active", true)
                    .get()
                    .get();

            return querySnapshot.getDocuments().stream()
                    .map(doc -> doc.toObject(Tenant.class))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding all active tenants", e);
            throw new RuntimeException("Failed to find active tenants", e);
        }
    }

    /**
     * Update tenant
     */
    public Tenant update(String tenantId, Tenant tenant) {
        try {
            tenant.setUpdatedAt(Timestamp.now());
            
            firestore.collection(TENANTS_COLLECTION)
                    .document(tenantId)
                    .set(tenant)
                    .get();

            return tenant;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error updating tenant: {}", tenantId, e);
            throw new RuntimeException("Failed to update tenant", e);
        }
    }

    // ========================================
    // SWIPE CRUD OPERATIONS
    // ========================================

    /**
     * Find all swipes by swiper ID
     */
    public List<Swipe> findSwipesBySwiperId(String swiperId) {
        try {
            QuerySnapshot querySnapshot = firestore.collection(SWIPES_COLLECTION)
                    .whereEqualTo("swiperId", swiperId)
                    .get()
                    .get();

            return querySnapshot.getDocuments().stream()
                    .map(doc -> doc.toObject(Swipe.class))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding swipes by swiper ID: {}", swiperId, e);
            throw new RuntimeException("Failed to find swipes", e);
        }
    }

    /**
     * Find swipe by swiper and target
     */
    public Optional<Swipe> findSwipe(String swiperId, String targetId) {
        try {
            QuerySnapshot querySnapshot = firestore.collection(SWIPES_COLLECTION)
                    .whereEqualTo("swiperId", swiperId)
                    .whereEqualTo("targetId", targetId)
                    .get()
                    .get();

            if (querySnapshot.isEmpty()) {
                return Optional.empty();
            }

            return Optional.of(querySnapshot.getDocuments().get(0).toObject(Swipe.class));
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding swipe between {} and {}", swiperId, targetId, e);
            throw new RuntimeException("Failed to find swipe", e);
        }
    }

    /**
     * Save swipe
     */
    public Swipe saveSwipe(Swipe swipe) {
        try {
            firestore.collection(SWIPES_COLLECTION)
                    .document(swipe.getId())
                    .set(swipe)
                    .get();

            return swipe;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error saving swipe", e);
            throw new RuntimeException("Failed to save swipe", e);
        }
    }

    // ========================================
    // MATCH CRUD OPERATIONS
    // ========================================

    /**
     * Find all active matches for a tenant
     */
    public List<Match> findActiveMatchesByTenantId(String tenantId) {
        try {

            // Need to query twice since Firestore doesn't support OR on different fields
            QuerySnapshot matches1 = firestore.collection(MATCHES_COLLECTION)
                    .whereEqualTo("tenant1Id", tenantId)
                    .whereEqualTo("status", "ACTIVE")
                    .get()
                    .get();

            QuerySnapshot matches2 = firestore.collection(MATCHES_COLLECTION)
                    .whereEqualTo("tenant2Id", tenantId)
                    .whereEqualTo("status", "ACTIVE")
                    .get()
                    .get();

            List<Match> allMatches = matches1.getDocuments().stream()
                    .map(doc -> doc.toObject(Match.class))
                    .collect(Collectors.toList());

            allMatches.addAll(matches2.getDocuments().stream()
                    .map(doc -> doc.toObject(Match.class))
                    .collect(Collectors.toList()));

            return allMatches;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding matches for tenant: {}", tenantId, e);
            throw new RuntimeException("Failed to find matches", e);
        }
    }

    /**
     * Save match
     */
    public Match saveMatch(Match match) {
        try {
            firestore.collection(MATCHES_COLLECTION)
                    .document(match.getId())
                    .set(match)
                    .get();

            return match;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error saving match", e);
            throw new RuntimeException("Failed to save match", e);
        }
    }

    // ========================================
    // CONVERSATION CRUD OPERATIONS
    // ========================================

    /**
     * Save conversation
     */
    public Conversation saveConversation(Conversation conversation) {
        try {
            firestore.collection(CONVERSATIONS_COLLECTION)
                    .document(conversation.getId())
                    .set(conversation)
                    .get();

            return conversation;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error saving conversation", e);
            throw new RuntimeException("Failed to save conversation", e);
        }
    }
    // Add to your existing TenantRepository class

    /**
     * Save a bookmark
     */
    public Bookmark saveBookmark(Bookmark bookmark) {
        try {
            DocumentReference docRef = firestore.collection("bookmarks").document(bookmark.getId());
            docRef.set(bookmark).get();
            log.info("Bookmark saved: {}", bookmark.getId());
            return bookmark;
        } catch (Exception e) {
            log.error("Error saving bookmark: {}", bookmark.getId(), e);
            throw new RuntimeException("Failed to save bookmark", e);
        }
    }

    /**
     * Find bookmark by tenant and room
     */
    public Optional<Bookmark> findBookmarkByTenantAndRoom(String tenantId, String roomId) {
        try {
            Query query = firestore.collection("bookmarks")
                    .whereEqualTo("tenantId", tenantId)
                    .whereEqualTo("roomId", roomId)
                    .limit(1);

            QuerySnapshot querySnapshot = query.get().get();

            if (!querySnapshot.isEmpty()) {
                DocumentSnapshot document = querySnapshot.getDocuments().get(0);
                return Optional.of(document.toObject(Bookmark.class));
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error finding bookmark for tenant {} and room {}", tenantId, roomId, e);
            throw new RuntimeException("Failed to find bookmark", e);
        }
    }

    /**
     * Find all bookmarks by tenant
     */
    public List<Bookmark> findBookmarksByTenantId(String tenantId) {
        try {
            Query query = firestore.collection("bookmarks")
                    .whereEqualTo("tenantId", tenantId)
                    .orderBy("createdAt", Query.Direction.DESCENDING);

            QuerySnapshot querySnapshot = query.get().get();

            return querySnapshot.getDocuments().stream()
                    .map(doc -> doc.toObject(Bookmark.class))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error finding bookmarks for tenant: {}", tenantId, e);
            throw new RuntimeException("Failed to retrieve bookmarks", e);
        }
    }

    /**
     * Delete bookmark
     */
    public void deleteBookmark(String bookmarkId) {
        try {
            firestore.collection("bookmarks").document(bookmarkId).delete().get();
            log.info("Bookmark deleted: {}", bookmarkId);
        } catch (Exception e) {
            log.error("Error deleting bookmark: {}", bookmarkId, e);
            throw new RuntimeException("Failed to delete bookmark", e);
        }
    }

    /**
     * Find room by ID (if not already in your repository)
     */
    public Optional<Room> findRoomById(String roomId) {
        try {
            DocumentReference docRef = firestore.collection("rooms").document(roomId);
            DocumentSnapshot document = docRef.get().get();

            if (document.exists()) {
                return Optional.of(document.toObject(Room.class));
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error finding room by ID: {}", roomId, e);
            throw new RuntimeException("Failed to retrieve room", e);
        }
    }
    /**
     * Find all bookmarks for a specific room
     */
    public List<Bookmark> findBookmarksByRoomId(String roomId) {
        try {
            Query query = firestore.collection("bookmarks")
                    .whereEqualTo("roomId", roomId);

            QuerySnapshot querySnapshot = query.get().get();

            return querySnapshot.getDocuments().stream()
                    .map(doc -> doc.toObject(Bookmark.class))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error finding bookmarks for room: {}", roomId, e);
            throw new RuntimeException("Failed to retrieve bookmarks for room", e);
        }
    }

    /**
     * Check if a conversation with specific participants already exists
     * @param participantIds List of participant IDs (order doesn't matter)
     */
    public Optional<Conversation> findConversationByParticipants(List<String> participantIds) {
        try {
            // Sort IDs to ensure consistent comparison
            List<String> sortedIds = participantIds.stream()
                    .sorted()
                    .collect(Collectors.toList());

            // Query all conversations
            QuerySnapshot querySnapshot = firestore.collection(CONVERSATIONS_COLLECTION)
                    .get()
                    .get();

            // Find conversation with exact matching participants
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                Conversation conversation = doc.toObject(Conversation.class);
                if (conversation != null) {
                    List<String> conversationParticipants = conversation.getParticipantIds()
                            .stream()
                            .sorted()
                            .collect(Collectors.toList());

                    // Check if participant lists match exactly
                    if (conversationParticipants.equals(sortedIds)) {
                        return Optional.of(conversation);
                    }
                }
            }

            return Optional.empty();
        } catch (Exception e) {
            log.error("Error finding conversation by participants", e);
            throw new RuntimeException("Failed to find conversation", e);
        }
    }

    /**
     * Check if two tenants have an active match
     */
    public boolean areTenantsMatched(String tenant1Id, String tenant2Id) {
        try {
            // Query for matches where tenant1 and tenant2 are matched
            QuerySnapshot matches1 = firestore.collection(MATCHES_COLLECTION)
                    .whereEqualTo("tenant1Id", tenant1Id)
                    .whereEqualTo("tenant2Id", tenant2Id)
                    .whereEqualTo("status", "ACTIVE")
                    .get()
                    .get();

            QuerySnapshot matches2 = firestore.collection(MATCHES_COLLECTION)
                    .whereEqualTo("tenant1Id", tenant2Id)
                    .whereEqualTo("tenant2Id", tenant1Id)
                    .whereEqualTo("status", "ACTIVE")
                    .get()
                    .get();

            return !matches1.isEmpty() || !matches2.isEmpty();
        } catch (Exception e) {
            log.error("Error checking if tenants are matched: {} and {}", tenant1Id, tenant2Id, e);
            throw new RuntimeException("Failed to check tenant match status", e);
        }
    }
}