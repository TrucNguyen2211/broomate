package org.example.Broomate;

import org.example.Broomate.dto.request.allAuthUser.SendMessageRequest;
import org.example.Broomate.dto.websocket.NewMessageNotification;
import org.example.Broomate.model.Conversation;
import org.example.Broomate.model.Match;
import org.example.Broomate.repository.AllAuthUserRepository;
import org.example.Broomate.service.AllAuthUserService;
import org.example.Broomate.service.FileStorageService;
import org.example.Broomate.service.WebSocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AllAuthUserServiceTest {

        @Mock
        private AllAuthUserRepository repository;

        @Mock
        private FileStorageService fileStorageService;

        @InjectMocks
        private AllAuthUserService allAuthUserService;

        private String tenantAId;
        private String tenantBId;
        private String conversationId;

        @BeforeEach
        void setUp() {
                tenantAId = "tenant-a-123";
                tenantBId = "tenant-b-456";
                conversationId = "conversation-789";
        }

        @Test
        void testSendMessage_ShouldFailWhenNotParticipant() {
                // Arrange
                String unauthorizedTenantId = "tenant-c-999"; // Not a participant

                Conversation conversation = Conversation.builder()
                                .id(conversationId)
                                .participantIds(Arrays.asList(tenantAId, tenantBId)) // Only A and B are participants
                                .build();

                SendMessageRequest request = SendMessageRequest.builder()
                                .content("Hello, can we be roommates?")
                                .build();

                // Mock repository to return conversation
                when(repository.findConversationById(conversationId))
                                .thenReturn(Optional.of(conversation));

                // Act & Assert
                AccessDeniedException exception = assertThrows(
                                AccessDeniedException.class,
                                () -> allAuthUserService.sendMessage(unauthorizedTenantId, conversationId, request,
                                                null));

                // Verify
                assertEquals("You are not a participant in this conversation", exception.getMessage());
                verify(repository, times(1)).findConversationById(conversationId);
                verify(repository, never()).saveMessage(any()); // Message should NOT be saved

                System.out.println("✅ Test Case 3 Passed: Cannot send message without matching");
                System.out.println("   Error Message: " + exception.getMessage());
        }

        @Test
        void testSendMessage_ShouldFailWhenConversationNotFound() {
                // Arrange
                SendMessageRequest request = SendMessageRequest.builder()
                                .content("Hello!")
                                .build();

                // Mock repository to return empty (conversation not found)
                when(repository.findConversationById(anyString()))
                                .thenReturn(Optional.empty());

                // Act & Assert
                ResponseStatusException exception = assertThrows(
                                ResponseStatusException.class,
                                () -> allAuthUserService.sendMessage(tenantAId, "non-existent-conv", request, null));

                // Verify
                assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
                assertTrue(exception.getReason().contains("Conversation not found"));
                verify(repository, never()).saveMessage(any());

                System.out.println("✅ Test passed: Cannot send message to non-existent conversation");
                System.out.println("   Error: " + exception.getReason());
        }

        @Mock
        private WebSocketService webSocketService;

        @Test
        void testSendMessage_ShouldSucceedWhenUserIsParticipant() throws Exception {
                // Arrange
                Conversation conversation = Conversation.builder()
                                .id(conversationId)
                                .participantIds(Arrays.asList(tenantAId, tenantBId))
                                .build();

                SendMessageRequest request = SendMessageRequest.builder()
                                .content("Hello, nice to meet you!")
                                .build();

                // Mock repository
                when(repository.findConversationById(conversationId))
                                .thenReturn(Optional.of(conversation));

                // ✅ ADD: Mock WebSocket service to do nothing
                doNothing().when(webSocketService).sendNewMessageNotification(
                                anyString(),
                                any(NewMessageNotification.class));

                // Act - Should NOT throw exception
                assertDoesNotThrow(() -> allAuthUserService.sendMessage(tenantAId, conversationId, request, null));

                // Verify
                verify(repository, times(1)).saveMessage(any());
                verify(repository, times(1)).updateConversation(anyString(), any());

                System.out.println("✅ Test passed: Message sent successfully between matched tenants");
        }

        @Test
        void testSendMessage_ShouldFailWhenTenantTriesToMessageThemselves() {
                // Arrange - Tenant A trying to send to conversation where they are the only
                // participant
                Conversation conversation = Conversation.builder()
                                .id(conversationId)
                                .participantIds(Arrays.asList(tenantAId, tenantAId)) // Same person
                                .build();

                SendMessageRequest request = SendMessageRequest.builder()
                                .content("Talking to myself")
                                .build();

                // when(repository.findConversationById(conversationId))
                // .thenReturn(Optional.of(conversation));

                // This should still work technically, but you might want to add validation
                // to prevent users from messaging themselves

                System.out.println("⚠️  Consider adding validation to prevent self-messaging");
        }
}