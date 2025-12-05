package org.example.Broomate.repository;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.Broomate.model.Account;
import org.example.Broomate.model.Conversation;
import org.example.Broomate.model.Message;
import org.example.Broomate.model.Room;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
@RequiredArgsConstructor
@Slf4j
@Repository
public class AllAuthUserRepository {

    private static final String ACCOUNTS_COLLECTION = "accounts";
    private static final String CONVERSATIONS_COLLECTION = "conversations";
    private static final String MESSAGES_COLLECTION = "messages";
    private static final String ROOMS_COLLECTION = "rooms";
    private final Firestore firestore;


    // ========================================
    // CONVERSATION OPERATIONS
    // ========================================

    /**
     * Find all conversations where user is a participant
     */
    public List<Conversation> findConversationsByUserId(String userId) {
        try {
            List<QueryDocumentSnapshot> documents = firestore.collection(CONVERSATIONS_COLLECTION)
                    .whereArrayContains("participantIds", userId)
                    .orderBy("lastMessageAt", com.google.cloud.firestore.Query.Direction.DESCENDING)
                    .get()
                    .get()
                    .getDocuments();

            List<Conversation> conversations = new ArrayList<>();
            for (QueryDocumentSnapshot document : documents) {
                conversations.add(document.toObject(Conversation.class));
            }

            return conversations;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding conversations for user: {}", userId, e);
            throw new RuntimeException("Failed to find conversations", e);
        }
    }

    /**
     * Find conversation by ID
     */
    public Optional<Conversation> findConversationById(String conversationId) {
        try {
            DocumentSnapshot document =  firestore
                    .collection(CONVERSATIONS_COLLECTION)
                    .document(conversationId)
                    .get()
                    .get();

            if (!document.exists()) {
                return Optional.empty();
            }

            return Optional.ofNullable(document.toObject(Conversation.class));
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding conversation by ID: {}", conversationId, e);
            throw new RuntimeException("Failed to find conversation", e);
        }
    }

    /**
     * Update conversation
     */
    public Conversation updateConversation(String conversationId, Conversation conversation) {
        try {
            conversation.setUpdatedAt(Timestamp.now());

            firestore.collection(CONVERSATIONS_COLLECTION)
                    .document(conversationId)
                    .set(conversation)
                    .get();

            return conversation;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error updating conversation: {}", conversationId, e);
            throw new RuntimeException("Failed to update conversation", e);
        }
    }

    // ========================================
    // MESSAGE OPERATIONS
    // ========================================

    /**
     * Save new message
     */
    public Message saveMessage(Message message) {
        try {
            firestore.collection(MESSAGES_COLLECTION)
                    .document(message.getId())
                    .set(message)
                    .get();

            return message;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error saving message", e);
            throw new RuntimeException("Failed to save message", e);
        }
    }

    // ========================================
    // ROOM OPERATIONS
    // ========================================

    /**
     * Find all published rooms
     */
    public List<Room> findAllPublishedRooms() {
        try {
            List<QueryDocumentSnapshot> documents = firestore.collection(ROOMS_COLLECTION)
                    .whereEqualTo("status", "PUBLISHED")
                    .get()
                    .get()
                    .getDocuments();

            List<Room> rooms = new ArrayList<>();
            for (QueryDocumentSnapshot document : documents) {
                rooms.add(document.toObject(Room.class));
            }

            return rooms;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding published rooms", e);
            throw new RuntimeException("Failed to find rooms", e);
        }
    }

    /**
     * Find room by ID
     */
    public Optional<Room> findRoomById(String roomId) {
        try {

            // ✅ Use DocumentSnapshot instead of QueryDocumentSnapshot
            DocumentSnapshot document = firestore
                    .collection(ROOMS_COLLECTION)
                    .document(roomId)
                    .get()
                    .get();

            if (!document.exists()) {
                return Optional.empty();
            }

            return Optional.ofNullable(document.toObject(Room.class));
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding room by ID: {}", roomId, e);
            throw new RuntimeException("Failed to find room", e);
        }
    }

    // ========================================
    // ACCOUNT OPERATIONS
    // ========================================

    /**
     * Find account by ID (works for both Tenant and Landlord)
     */
    public Optional<Account> findAccountById(String userId) {
        try {

            // Try tenants collection first
            DocumentSnapshot document = firestore
                    .collection("tenants")
                    .document(userId)
                    .get()
                    .get();

            if (document.exists()) {
                return Optional.of(document.toObject(Account.class));
            }

            // Try landlords collection
            document =  firestore
                    .collection("landlords")
                    .document(userId)
                    .get()
                    .get();

            if (document.exists()) {
                return Optional.ofNullable(document.toObject(Account.class));
            }

            return Optional.empty();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding account by ID: {}", userId, e);
            throw new RuntimeException("Failed to find account", e);
        }
    }

    /**
     * Update account (works for both Tenant and Landlord)
     */
    public Account updateAccount(String userId, Account account) {
        try {
            account.setUpdatedAt(Timestamp.now());

            // Determine collection based on role
            String collection = account.getRole() == Account.AccountRoleEnum.TENANT ? "tenants" : "landlords";

            firestore.collection(collection)
                    .document(userId)
                    .set(account)
                    .get();

            return account;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error updating account: {}", userId, e);
            throw new RuntimeException("Failed to update account", e);
        }
    }
    /**
     * Find all messages in a conversation
     */
    public List<Message> findMessagesByConversationId(String conversationId) {
        try {
            List<QueryDocumentSnapshot> documents = firestore.collection(MESSAGES_COLLECTION)
                    .whereEqualTo("conversationId", conversationId)
                    .orderBy("createdAt", com.google.cloud.firestore.Query.Direction.ASCENDING)
                    .get()
                    .get()
                    .getDocuments();

            List<Message> messages = new ArrayList<>();
            for (QueryDocumentSnapshot document : documents) {
                messages.add(document.toObject(Message.class));
            }

            return messages;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding messages for conversation: {}", conversationId, e);
            throw new RuntimeException("Failed to find messages", e);
        }
    }
}