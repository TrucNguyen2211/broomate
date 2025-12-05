package org.example.Broomate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Autowired;
import org.example.Broomate.util.SampleDataPopulator;

@SpringBootApplication
public class BroomateApplication {

    @Autowired
    private Environment environment;
    
    @Autowired
    private SampleDataPopulator sampleDataPopulator;

    public static void main(String[] args) {
        SpringApplication.run(BroomateApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initializeApplication() {
        // Check if database is empty and populate sample data
        if (sampleDataPopulator.isDatabaseEmpty()) {
            System.out.println("\n" + "=".repeat(60));
            System.out.println("🗄️  DATABASE IS EMPTY - POPULATING SAMPLE DATA");
            System.out.println("=".repeat(60));
            sampleDataPopulator.populateSampleData();
            System.out.println("=".repeat(60) + "\n");
        } else {
            System.out.println("\n" + "=".repeat(60));
            System.out.println("📊 DATABASE CONTAINS DATA - SKIPPING SAMPLE DATA POPULATION");
            System.out.println("=".repeat(60) + "\n");
        }
        
        // Print application info
        printApplicationInfo();
    }
    
    private void printApplicationInfo() {
        String serverPort = environment.getProperty("server.port", "8080");
        String contextPath = environment.getProperty("server.servlet.context-path", "");
        String baseUrl = "http://localhost:" + serverPort + contextPath;
        
        System.out.println("\n" + "=".repeat(60));
        System.out.println("🚀 BROOMATE APPLICATION STARTED SUCCESSFULLY! 🚀");
        System.out.println("=".repeat(60));
        System.out.println("📡 Server is running at: " + baseUrl);
        System.out.println("📚 Swagger API Docs: " + baseUrl + "/swagger-ui.html");
        System.out.println("=".repeat(60));
        System.out.println("🎯 Available API Endpoints:");
        System.out.println("   • Authentication: " + baseUrl + "/api/auth");
        System.out.println("   • Rooms: " + baseUrl + "/api/rooms");
        System.out.println("   • Tenants: " + baseUrl + "/api/tenants");
        System.out.println("   • Landlords: " + baseUrl + "/api/landlords");
        System.out.println("   • Messages: " + baseUrl + "/api/messages");
        System.out.println("   • Swipes: " + baseUrl + "/api/swipes");
        System.out.println("=".repeat(60));
        System.out.println("💡 Tip: Open Swagger UI to explore and test the APIs!");
        System.out.println("=".repeat(60) + "\n");
    }
}
