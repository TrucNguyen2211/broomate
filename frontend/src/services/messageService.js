// FE/src/services/messageService.js
import api from './api';

const messageService = {
  // ===== CONVERSATIONS =====
  
  /**
   * Get all conversations for current user
   * Backend: GET /api/user/conversations
   * Returns: ConversationListResponse { conversations: [...], totalCount: N }
   */
  getAllConversations: async () => {
    const response = await api.get('/user/conversations');
    return response.data;
  },

  /**
   * Get conversation detail with messages
   * Backend: GET /api/user/conversations/{conversationId}
   * Returns: ConversationDetailResponse (with messages, allParticipants, conversationType)
   */
  getConversationDetail: async (conversationId) => {
    const response = await api.get(`/user/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Alias for getConversationDetail (backward compatibility)
   */
  getMessages: async (conversationId) => {
    const data = await messageService.getConversationDetail(conversationId);
    return { messages: data.messages || [] };
  },

  // ===== SEND MESSAGE =====
  
  /**
   * Send message with optional file attachment
   * Backend: POST /api/user/conversations/{conversationId}/messages
   * 
   * Request params:
   * - content: string (message text)
   * - media: MultipartFile (optional - image/video/document)
   * 
   * Returns: MessageDetailResponse
   */
  sendMessage: async (conversationId, content, file = null) => {
    const formData = new FormData();
    formData.append('content', content || '');
    
    if (file) {
      formData.append('media', file);
      console.log(`📎 Attaching file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    const response = await api.post(
      `/user/conversations/${conversationId}/messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },

  /**
   * Mark conversation as read
   * Note: Not implemented in backend yet, returns null silently
   */
  markAsRead: async (conversationId) => {
    // Backend endpoint doesn't exist yet
    return null;
  }
};

export default messageService;