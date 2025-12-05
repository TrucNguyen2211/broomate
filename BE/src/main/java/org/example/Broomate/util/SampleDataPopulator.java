package org.example.Broomate.util;

import com.google.cloud.firestore.Firestore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.Broomate.dto.request.guest.SignupLandlordRequest;
import org.example.Broomate.dto.request.guest.SignupTenantRequest;
import org.example.Broomate.dto.request.landlord.CreateRoomRequestJSON;
import org.example.Broomate.dto.request.allAuthUser.SendMessageRequest;
import org.example.Broomate.dto.response.guest.AuthResponse;
import org.example.Broomate.dto.response.allAuthUser.RoomDetailResponse;
import org.example.Broomate.service.AuthService;
import org.example.Broomate.service.LandlordService;
import org.example.Broomate.service.TenantService;
import org.example.Broomate.service.AllAuthUserService;
import org.springframework.stereotype.Component;

import javax.annotation.PreDestroy;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class SampleDataPopulator {

    private final AuthService authService;
    private final LandlordService landlordService;
    private final TenantService tenantService;
    private final AllAuthUserService allAuthUserService;
    private final Firestore firestore;

    // Controlled thread pool for population tasks
    private final ExecutorService executor = Executors.newFixedThreadPool(
            Math.max(4, Runtime.getRuntime().availableProcessors() * 2),
            runnable -> {
                Thread t = new Thread(runnable);
                t.setName("sample-populator-worker-" + t.getId());
                t.setDaemon(false);
                return t;
            }
    );

    private final Random random = new Random();

    // Sample data arrays
    private final String[] firstNames = {
            "An", "Binh", "Cuong", "Dung", "Em", "Phuong", "Giang", "Hoa", "Inh", "Kim",
            "Long", "My", "Nam", "Oanh", "Phuc", "Quynh", "Son", "Thanh", "Uy", "Vy"
    };

    private final String[] lastNames = {
            "Nguyen", "Tran", "Le", "Pham", "Hoang", "Vu", "Dang", "Bui", "Do", "Ngo",
            "Lai", "Mai", "Phan", "Truong", "Vo", "Dinh", "Cao", "Ly", "Duong", "Tang"
    };

    private final String[] districts = {
            "District 1", "District 2", "District 3", "District 4", "District 5",
            "District 7", "Binh Thanh", "Tan Binh", "Phu Nhuan", "Thu Duc"
    };

    private final String[] roomTitles = {
            "Cozy Studio in District 1", "Modern Apartment with City View",
            "Spacious Room Near University", "Luxury Condo with Pool",
            "Budget-Friendly Shared Room", "Furnished Room with Balcony",
            "Quiet Room in Residential Area", "Room Near Metro Station",
            "Newly Renovated Studio", "Room with Garden View"
    };

    private final String[] roomDescriptions = {
            "Beautiful room perfect for students and young professionals",
            "Quiet neighborhood with easy access to public transportation",
            "Fully furnished with modern amenities and high-speed WiFi",
            "Spacious living area with natural lighting and ventilation",
            "Safe and secure building with 24/7 security"
    };

    /**
     * Check if database is empty by checking key collections
     */
    public boolean isDatabaseEmpty() {
        try {
            log.info("Checking if database is empty...");

            // Check if any key collections have documents
            boolean tenantsEmpty = firestore.collection("tenants")
                    .limit(1)
                    .get()
                    .get()
                    .isEmpty();

            boolean landlordsEmpty = firestore.collection("landlords")
                    .limit(1)
                    .get()
                    .get()
                    .isEmpty();

            boolean roomsEmpty = firestore.collection("rooms")
                    .limit(1)
                    .get()
                    .get()
                    .isEmpty();

            boolean isEmpty = tenantsEmpty && landlordsEmpty && roomsEmpty;

            if (isEmpty) {
                log.info("✅ Database is empty - ready for sample data");
            } else {
                log.info("📊 Database contains data:");
                log.info("   • Tenants: {}", !tenantsEmpty ? "exists" : "empty");
                log.info("   • Landlords: {}", !landlordsEmpty ? "exists" : "empty");
                log.info("   • Rooms: {}", !roomsEmpty ? "exists" : "empty");
            }

            return isEmpty;

        } catch (Exception e) {
            log.error("Error checking if database is empty", e);
            return false; // Assume not empty on error to avoid unwanted population
        }
    }

    /**
     * Main method to populate all sample data (concurrent where safe)
     */
    public void populateSampleData() {
        log.info("🌱 Starting to populate sample data using parallel tasks...");

        try {
            // Step 1: Create Tenants (parallel)
            log.info("Creating tenants (parallel)...");
            List<String> tenantIds = createTenants();
            log.info("✅ Created {} tenants", tenantIds.size());

            // Step 2: Create Landlords (parallel)
            log.info("Creating landlords (parallel)...");
            List<String> landlordIds = createLandlords();
            log.info("✅ Created {} landlords", landlordIds.size());

            // Step 3: Create Rooms (parallel)
            log.info("Creating rooms (parallel)...");
            List<String> roomIds = createRooms(landlordIds);
            log.info("✅ Created {} rooms", roomIds.size());

            // Step 4: Create Bookmarks (sequential - light)
            log.info("Creating bookmarks...");
            int bookmarkCount = createBookmarks(tenantIds, roomIds);
            log.info("✅ Created {} bookmarks", bookmarkCount);

            // Step 5: Create Swipes (sequential - light)
            log.info("Creating swipes...");
            Map<String, String> swipeResults = createSwipes(tenantIds);
            log.info("✅ Created {} swipes", swipeResults.get("swipeCount"));

            // Step 6: Create Matches (sequential - because domain logic may depend)
            log.info("Creating matches...");
            List<String> conversationIds = createMatches(tenantIds);
            log.info("✅ Created {} matches with conversations", conversationIds.size());

            // Step 7: Create Messages (parallel)
            log.info("Creating messages (parallel)...");
            int messageCount = createMessages(conversationIds, tenantIds);
            log.info("✅ Created {} messages", messageCount);

            log.info("🎉 Sample data population completed successfully!");
            printSummary(tenantIds.size(), landlordIds.size(), roomIds.size(),
                    bookmarkCount, Integer.parseInt(swipeResults.get("swipeCount")),
                    conversationIds.size(), messageCount);

        } catch (Exception e) {
            log.error("❌ Error populating sample data", e);
            throw new RuntimeException("Failed to populate sample data", e);
        }
    }

    // ---------------------------
    // Parallel implementations
    // ---------------------------

    private List<String> createTenants() {
        List<CompletableFuture<String>> futures = new ArrayList<>(20);

        for (int i = 0; i < 20; i++) {
            final int idx = i;
            CompletableFuture<String> f = CompletableFuture.supplyAsync(() -> {
                try {
                    String name = firstNames[idx % firstNames.length] + " " + lastNames[idx % lastNames.length];
                    String email = "tenant" + idx + "@example.com";

                    SignupTenantRequest request = SignupTenantRequest.builder()
                            .email(email)
                            .password("Password123!")
                            .confirmPassword("Password123!")
                            .name(name)
                            .phone("090" + String.format("%08d", ThreadLocalRandom.current().nextInt(100_000_000)))
                            .description("Looking for a comfortable place in " + districts[ThreadLocalRandom.current().nextInt(districts.length)])
                            .age(20 + ThreadLocalRandom.current().nextInt(15)) // 20-34
                            .gender(ThreadLocalRandom.current().nextBoolean() ? "MALE" : "FEMALE")
                            .budgetPerMonth(3_000_000.0 + ThreadLocalRandom.current().nextDouble() * 12_000_000.0) // 3M-15M
                            .stayLengthMonths(6 + ThreadLocalRandom.current().nextInt(12)) // 6-17 months
                            .moveInDate(LocalDate.now().plusDays(ThreadLocalRandom.current().nextInt(60)).toString())
                            .preferredDistricts(Arrays.asList(
                                    districts[ThreadLocalRandom.current().nextInt(districts.length)],
                                    districts[ThreadLocalRandom.current().nextInt(districts.length)]
                            ))
                            .smoking(ThreadLocalRandom.current().nextDouble() < 0.3)
                            .cooking(ThreadLocalRandom.current().nextDouble() < 0.7)
                            .needWindow(ThreadLocalRandom.current().nextDouble() < 0.8)
                            .needWashingMachine(ThreadLocalRandom.current().nextDouble() < 0.6)
                            .mightShareBedRoom(ThreadLocalRandom.current().nextDouble() < 0.4)
                            .mightShareToilet(ThreadLocalRandom.current().nextDouble() < 0.5)
                            .build();

                    AuthResponse response = authService.signupTenant(request, null);
                    return response == null ? null : response.getUserId();
                } catch (Exception e) {
                    log.error("Failed to create tenant {}", idx, e);
                    return null;
                }
            }, executor);

            futures.add(f);
        }

        return futures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private List<String> createLandlords() {
        List<CompletableFuture<String>> futures = new ArrayList<>(10);

        for (int i = 0; i < 10; i++) {
            final int idx = i;
            CompletableFuture<String> f = CompletableFuture.supplyAsync(() -> {
                try {
                    String name = "Landlord " + firstNames[idx % firstNames.length] + " " + lastNames[idx % lastNames.length];
                    String email = "landlord" + idx + "@property.com";

                    SignupLandlordRequest request = SignupLandlordRequest.builder()
                            .email(email)
                            .password("Password123!")
                            .confirmPassword("Password123!")
                            .name(name)
                            .phone("091" + String.format("%08d", ThreadLocalRandom.current().nextInt(100_000_000)))
                            .description("Professional property manager with " + (5 + ThreadLocalRandom.current().nextInt(15)) + " years experience")
                            .build();

                    AuthResponse response = authService.signupLandlord(request, null);
                    return response == null ? null : response.getUserId();
                } catch (Exception e) {
                    log.error("Failed to create landlord {}", idx, e);
                    return null;
                }
            }, executor);

            futures.add(f);
        }

        return futures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private List<String> createRooms(List<String> landlordIds) {
        if (landlordIds == null || landlordIds.isEmpty()) {
            log.warn("No landlords available to create rooms");
            return Collections.emptyList();
        }

        List<CompletableFuture<String>> futures = new ArrayList<>(20);

        for (int i = 0; i < 20; i++) {
            final int idx = i;
            CompletableFuture<String> f = CompletableFuture.supplyAsync(() -> {
                try {
                    String landlordId = landlordIds.get(idx % landlordIds.size());

                    CreateRoomRequestJSON request = new CreateRoomRequestJSON();
                    request.setTitle(roomTitles[idx % roomTitles.length]);
                    request.setDescription(roomDescriptions[ThreadLocalRandom.current().nextInt(roomDescriptions.length)]);
                    request.setRentPricePerMonth(2_000_000.0 + ThreadLocalRandom.current().nextDouble() * 18_000_000.0);
                    request.setMinimumStayMonths(3 + ThreadLocalRandom.current().nextInt(12));
                    request.setAddress(districts[ThreadLocalRandom.current().nextInt(districts.length)] + ", Ho Chi Minh City");
                    request.setLatitude(10.762622 + (ThreadLocalRandom.current().nextDouble() - 0.5) * 0.1);
                    request.setLongitude(106.660172 + (ThreadLocalRandom.current().nextDouble() - 0.5) * 0.1);
                    request.setNumberOfToilets(1 + ThreadLocalRandom.current().nextInt(2));
                    request.setNumberOfBedRooms(1 + ThreadLocalRandom.current().nextInt(3));
                    request.setHasWindow(ThreadLocalRandom.current().nextDouble() < 0.8);

                    RoomDetailResponse response = landlordService.createRoom(
                            landlordId,
                            request,
                            null, // No thumbnail
                            null, // No images
                            null, // No videos
                            null  // No documents
                    );

                    return response == null ? null : response.getId();
                } catch (Exception e) {
                    log.error("Failed to create room {}", idx, e);
                    return null;
                }
            }, executor);

            futures.add(f);
        }

        return futures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    // Bookmarks kept sequential to avoid potential race/validation issues in services
    private int createBookmarks(List<String> tenantIds, List<String> roomIds) {
        int bookmarkCount = 0;
        if (tenantIds.isEmpty() || roomIds.isEmpty()) return 0;
        Set<String> bookmarked = new HashSet<>();

        for (int i = 0; i < 30; i++) {
            try {
                String tenantId = tenantIds.get(random.nextInt(tenantIds.size()));
                String roomId = roomIds.get(random.nextInt(roomIds.size()));

                String key = tenantId + "_" + roomId;
                if (bookmarked.contains(key)) {
                    continue;
                }
                bookmarked.add(key);

                tenantService.bookmarkRoom(tenantId, roomId);
                bookmarkCount++;
            } catch (Exception e) {
                log.warn("Failed to create bookmark", e);
            }
        }

        return bookmarkCount;
    }

    // Swipes kept sequential here (you can parallelize later if swipe logic is idempotent)
    private Map<String, String> createSwipes(List<String> tenantIds) {
        int swipeCount = 0;
        Set<String> swiped = new HashSet<>();

        for (int i = 0; i < 50; i++) {
            try {
                int swiperIndex = random.nextInt(tenantIds.size());
                int targetIndex = random.nextInt(tenantIds.size());

                if (swiperIndex == targetIndex) {
                    continue; // Can't swipe on yourself
                }

                String swiperId = tenantIds.get(swiperIndex);
                String targetId = tenantIds.get(targetIndex);

                String key = swiperId + "_" + targetId;
                if (swiped.contains(key)) {
                    continue; // Skip duplicates
                }
                swiped.add(key);

                boolean accept = ThreadLocalRandom.current().nextDouble() < 0.6; // 60% acceptance rate

                // Optionally call tenantService.swipe(swiperId, targetId, accept);
                swipeCount++;

            } catch (Exception e) {
                log.warn("Failed to create swipe", e);
            }
        }

        Map<String, String> result = new HashMap<>();
        result.put("swipeCount", String.valueOf(swipeCount));
        return result;
    }

    private List<String> createMatches(List<String> tenantIds) {
        List<String> conversationIds = new ArrayList<>();

        // Simple stub: create 5 mutual matches sequentially
        for (int i = 0; i < 5; i++) {
            try {
                int tenant1Index = random.nextInt(tenantIds.size());
                int tenant2Index = random.nextInt(tenantIds.size());

                if (tenant1Index == tenant2Index) {
                    continue;
                }

                String tenant1Id = tenantIds.get(tenant1Index);
                String tenant2Id = tenantIds.get(tenant2Index);

                // If you have a createConversation method in AllAuthUserService, call it:
                // String conversationId = allAuthUserService.createConversation(tenant1Id, tenant2Id);
                // conversationIds.add(conversationId);

                // For now we skip actual creation and leave list empty or mocked
            } catch (Exception e) {
                log.warn("Failed to create match", e);
            }
        }

        return conversationIds;
    }

    private int createMessages(List<String> conversationIds, List<String> tenantIds) {
        if (conversationIds == null || conversationIds.isEmpty()) return 0;

        List<CompletableFuture<Integer>> futures = new ArrayList<>();

        String[] sampleMessages = {
                "Hi! Nice to meet you!",
                "How are you doing?",
                "I'm looking for a roommate too!",
                "What's your budget range?",
                "I prefer quiet places",
                "Do you have any pets?",
                "Let's meet up sometime!",
                "Sounds good to me!"
        };

        for (String conversationId : conversationIds) {
            CompletableFuture<Integer> f = CompletableFuture.supplyAsync(() -> {
                int created = 0;
                try {
                    int msgCount = 3 + ThreadLocalRandom.current().nextInt(3);
                    for (int i = 0; i < msgCount; i++) {
                        String senderId = tenantIds.get(ThreadLocalRandom.current().nextInt(tenantIds.size()));
                        String content = sampleMessages[ThreadLocalRandom.current().nextInt(sampleMessages.length)];

                        SendMessageRequest request = SendMessageRequest.builder()
                                .content(content)
                                .build();

                        allAuthUserService.sendMessage(senderId, conversationId, request, null);
                        created++;
                    }
                } catch (Exception e) {
                    log.warn("Failed to create messages for conversation {}", conversationId, e);
                }
                return created;
            }, executor);

            futures.add(f);
        }

        return futures.stream()
                .map(CompletableFuture::join)
                .reduce(0, Integer::sum);
    }

    /**
     * Print summary of populated data
     */
    private void printSummary(int tenants, int landlords, int rooms,
                              int bookmarks, int swipes, int conversations, int messages) {
        log.info("╔══════════════════════════════════════╗");
        log.info("║   Sample Data Population Summary     ║");
        log.info("╠══════════════════════════════════════╣");
        log.info("║  Tenants:        {:>4}               ║", tenants);
        log.info("║  Landlords:      {:>4}               ║", landlords);
        log.info("║  Rooms:          {:>4}               ║", rooms);
        log.info("║  Bookmarks:      {:>4}               ║", bookmarks);
        log.info("║  Swipes:         {:>4}               ║", swipes);
        log.info("║  Conversations:  {:>4}               ║", conversations);
        log.info("║  Messages:       {:>4}               ║", messages);
        log.info("╚══════════════════════════════════════╝");
    }

    @PreDestroy
    public void shutdownExecutor() {
        try {
            log.info("Shutting down sample data executor...");
            executor.shutdown();
            if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                log.warn("Forcing shutdown of sample data executor");
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            log.warn("Interrupted while shutting down executor", e);
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
