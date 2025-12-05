package org.example.Broomate.repository;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.Broomate.model.Landlord;
import org.example.Broomate.model.Room;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@RequiredArgsConstructor
@Slf4j
@Repository
public class LandlordRepository {

    private static final String LANDLORDS_COLLECTION = "landlords";
    private static final String ROOMS_COLLECTION = "rooms";
    private final Firestore firestore;

    // ========================================
    // LANDLORD CRUD OPERATIONS
    // ========================================

    /**
     * Find landlord by ID
     */
    public Optional<Landlord> findById(String landlordId) {
        try {
            DocumentSnapshot document = firestore
                    .collection(LANDLORDS_COLLECTION)
                    .document(landlordId)
                    .get()
                    .get();

            if (!document.exists()) {
                return Optional.empty();
            }

            return Optional.ofNullable(document.toObject(Landlord.class));
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding landlord by ID: {}", landlordId, e);
            throw new RuntimeException("Failed to find landlord", e);
        }
    }

    /**
     * Update landlord
     */
    public Landlord update(String landlordId, Landlord landlord) {
        try {
            landlord.setUpdatedAt(Timestamp.now());

            firestore.collection(LANDLORDS_COLLECTION)
                    .document(landlordId)
                    .set(landlord)
                    .get();

            return landlord;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error updating landlord: {}", landlordId, e);
            throw new RuntimeException("Failed to update landlord", e);
        }
    }

    // ========================================
    // ROOM CRUD OPERATIONS
    // ========================================

    /**
     * Save new room
     */
    public Room saveRoom(Room room) {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            firestore.collection(ROOMS_COLLECTION)
                    .document(room.getId())
                    .set(room)
                    .get();

            return room;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error saving room", e);
            throw new RuntimeException("Failed to save room", e);
        }
    }

    /**
     * Find room by ID
     */
    public Optional<Room> findRoomById(String roomId) {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
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

    /**
     * Update room
     */
    public Room updateRoom(String roomId, Room room) {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            room.setUpdatedAt(Timestamp.now());

            firestore.collection(ROOMS_COLLECTION)
                    .document(roomId)
                    .set(room)
                    .get();

            return room;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error updating room: {}", roomId, e);
            throw new RuntimeException("Failed to update room", e);
        }
    }

    /**
     * Find all rooms by landlord user ID
     */
    public List<Room> findRoomsByLandlordUserId(String landlordUserId) {
        try {
            List<QueryDocumentSnapshot> documents = firestore.collection(ROOMS_COLLECTION)
                    .whereEqualTo("landlordId", landlordUserId)
                    .orderBy("createdAt", com.google.cloud.firestore.Query.Direction.DESCENDING)
                    .get()
                    .get()
                    .getDocuments();

            List<Room> rooms = new ArrayList<>();
            for (QueryDocumentSnapshot document : documents) {
                rooms.add(document.toObject(Room.class));
            }

            return rooms;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding rooms for landlord: {}", landlordUserId, e);
            throw new RuntimeException("Failed to find rooms for landlord", e);
        }
    }
}