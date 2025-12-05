package org.example.Broomate.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import lombok.RequiredArgsConstructor;
import org.example.Broomate.model.BaseModel;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
@RequiredArgsConstructor

@Repository
public class FirestoreRepository<T extends BaseModel> {
    private final Firestore firestore;

    // Create or Update
    public String save(String collectionName, T entity) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> result;

        if (entity.getId() == null || entity.getId().isEmpty()) {
            // Create new document with auto-generated ID
            DocumentReference docRef = firestore.collection(collectionName).document();
            entity.setId(docRef.getId());
            result = docRef.set(entity);
        } else {
            // Update existing document
            result = firestore.collection(collectionName)
                    .document(entity.getId())
                    .set(entity);
        }

        result.get();
        return entity.getId();
    }

    // Read by ID
    public T findById(String collectionName, String id, Class<T> clazz)
            throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return document.toObject(clazz);
        }
        return null;
    }

    // Read all
    public List<T> findAll(String collectionName, Class<T> clazz)
            throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        List<T> entities = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            entities.add(document.toObject(clazz));
        }
        return entities;
    }

    // Delete
    public void delete(String collectionName, String id)
            throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> writeResult = firestore.collection(collectionName)
                .document(id)
                .delete();
        writeResult.get();
    }

    // Query with conditions
    public List<T> findByField(String collectionName, String fieldName, Object value, Class<T> clazz)
            throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo(fieldName, value)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<T> entities = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            entities.add(document.toObject(clazz));
        }
        return entities;
    }
}