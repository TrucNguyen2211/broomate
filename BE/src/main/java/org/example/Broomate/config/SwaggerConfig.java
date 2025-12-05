package org.example.Broomate.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        // Define security scheme
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization")
                .description("JWT Authentication");

        // Define API info
        Info info = new Info()
                .title("Broomate API")
                .description("REST API for Broomate - Roommate Matching Platform")
                .version("1.0.0")
                .contact(new Contact()
                        .name("Broomate Team")
                        .email("support@broomate.com")
                        .url("https://broomate.com"))
                .license(new License()
                        .name("Apache 2.0")
                        .url("https://www.apache.org/licenses/LICENSE-2.0.html"));

        // Define servers
        Server localServer = new Server()
                .url("http://localhost:8080")
                .description("Local Development Server");

        Server prodServer = new Server()
                .url("https://broomate.onrender.com")
                .description("Production Server");

        // Build OpenAPI
        // NOTE: Security requirement is NOT added globally here
        // Individual endpoints will specify @SecurityRequirement annotation if needed
        return new OpenAPI()
                .openapi("3.1.0")  // Explicitly set OpenAPI version to 3.1.0
                .info(info)
                .servers(List.of(localServer, prodServer))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", securityScheme));
                // Removed .addSecurityItem() so public endpoints don't require auth in Swagger UI
    }
}