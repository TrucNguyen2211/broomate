package org.example.Broomate.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;

    // ✅ Add explicit constructor with logging
    public WebSocketConfig(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
        log.info("🔧 WebSocketConfig initialized with JwtUtil: {}", jwtUtil != null ? "✅ SUCCESS" : "❌ NULL");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        log.info("🔧 Configuring message broker...");
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        log.info("🔧 Registering STOMP endpoints...");
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        log.info("🔧 Configuring client inbound channel with authentication interceptor...");
        
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                log.debug("📨 Processing message with command: {}", accessor != null ? accessor.getCommand() : "NULL");
                
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    log.info("🔌 CONNECT command detected, processing authentication...");
                    
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    log.info("🔑 Authorization header present: {}", authHeader != null);
                    
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        log.info("🎫 Extracted token (first 20 chars): {}...", token.substring(0, Math.min(20, token.length())));
                        
                        try {
                            // ✅ Extract userId from JWT
                            String userId = jwtUtil.extractUserId(token);
                            String role = jwtUtil.extractRole(token);
                            
                            log.info("👤 Extracted from token - userId: {}, role: {}", userId, role);
                            
                            if (userId != null) {
                                // ✅ Set userId as the principal
                                UsernamePasswordAuthenticationToken authentication = 
                                    new UsernamePasswordAuthenticationToken(
                                        userId,  // ✅ CRITICAL: This is the user identifier
                                        null,
                                        List.of(new SimpleGrantedAuthority(role))
                                    );
                                
                                accessor.setUser(authentication);
                                
                                log.info("✅ WebSocket authenticated for user: {} with role: {}", userId, role);
                                log.info("🎯 Authentication principal name: {}", authentication.getName());
                            } else {
                                log.warn("⚠️ No userId found in JWT token");
                            }
                        } catch (Exception e) {
                            log.error("❌ Failed to authenticate WebSocket: {}", e.getMessage(), e);
                        }
                    } else {
                        log.warn("⚠️ No valid Authorization header in WebSocket CONNECT");
                    }
                } else {
                    log.debug("📨 Non-CONNECT message: {}", accessor != null ? accessor.getCommand() : "NULL");
                }
                
                return message;
            }
        });
        
        log.info("✅ Authentication interceptor registered successfully");
    }
}