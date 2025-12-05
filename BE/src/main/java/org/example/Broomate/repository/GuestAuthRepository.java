package org.example.Broomate.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.Broomate.model.Account;
import org.example.Broomate.model.Landlord;
import org.example.Broomate.model.Tenant;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ExecutionException;
@RequiredArgsConstructor
@Slf4j
@Repository
public class GuestAuthRepository {

    private static final String TENANTS_COLLECTION = "tenants";
    private static final String LANDLORDS_COLLECTION = "landlords";
    private final Firestore firestore;

    // ========================================
    // FIND BY EMAIL (checks both collections)
    // ========================================
    public Optional<Account> findByEmail(String email) {
        try {

            // 1. Try to find in tenants collection
            QueryDocumentSnapshot tenantDoc = (QueryDocumentSnapshot) firestore
                    .collection(TENANTS_COLLECTION)
                    .whereEqualTo("email", email)
                    .limit(1)
                    .get()
                    .get()
                    .getDocuments()
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (tenantDoc != null) {
                return Optional.of(tenantDoc.toObject(Tenant.class));
            }

            // 2. Try to find in landlords collection
            QueryDocumentSnapshot landlordDoc = (QueryDocumentSnapshot) firestore
                    .collection(LANDLORDS_COLLECTION)
                    .whereEqualTo("email", email)
                    .limit(1)
                    .get()
                    .get()
                    .getDocuments()
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (landlordDoc != null) {
                return Optional.of(landlordDoc.toObject(Landlord.class));
            }

            return Optional.empty();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding account by email: {}", email, e);
            throw new RuntimeException("Failed to find account", e);
        }
    }

    // ========================================
    // SAVE TENANT
    // ========================================
    public Tenant saveTenant(Tenant tenant) {
        try {
            firestore.collection(TENANTS_COLLECTION)
                    .document(tenant.getId())
                    .set(tenant)
                    .get();

            return tenant;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error saving tenant", e);
            throw new RuntimeException("Failed to save tenant", e);
        }
    }

    // ========================================
    // SAVE LANDLORD
    // ========================================
    public Landlord saveLandlord(Landlord landlord) {
        try {
            firestore.collection(LANDLORDS_COLLECTION)
                    .document(landlord.getId())
                    .set(landlord)
                    .get();

            return landlord;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error saving landlord", e);
            throw new RuntimeException("Failed to save landlord", e);
        }
    }
}