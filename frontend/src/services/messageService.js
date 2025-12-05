// src/services/messageService.js
import api from './api';

const messageService = {
  // ===== CONVERSATIONS =====
  
  /**
   * Get all conversations for current user
   * Backend: GET /api/user/conversations
   * Returns: ConversationListResponse with conversations array
   */
  getAllConversations: async () => {
    const response = await api.get('/user/conversations');
    return response.data; // { conversations: [...], totalCount: N, message: "..." }
  },

  /**
   * ✅ FIXED: Get conversation detail with messages
   * Backend: GET /api/user/conversations/{conversationId}
   * Returns: ConversationDetailResponse with messages array included
   */
  getConversationDetail: async (conversationId) => {
    const response = await api.get(`/user/conversations/${conversationId}`);
    return response.data; // { id, participantIds, messages: [...], ... }
  },

  /**
   * ✅ ALIAS: getMessages now uses getConversationDetail
   * Kept for backward compatibility with your components
   */
  getMessages: async (conversationId) => {
    const data = await messageService.getConversationDetail(conversationId);
    return { messages: data.messages || [] };
  },

  // ===== SEND MESSAGE =====
  
  /**
   * Send message with optional file attachment
   * Backend: POST /api/user/conversations/{conversationId}/messages
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Message text content
   * @param {File|null} file - Optional file (image, video, or document)
   * @returns {Promise<MessageDetailResponse>}
   */
  sendMessage: async (conversationId, content, file = null) => {
    const formData = new FormData();
    formData.append('content', content || ''); // ✅ Allow empty content if file present
    
    // ✅ Add file if provided
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
    
    return response.data; // Returns MessageDetailResponse
  },

  /**
   * Mark messages as read (OPTIONAL - Not implemented in backend yet)
   */
  markAsRead: async (conversationId) => {
    // ✅ Just return null silently - backend doesn't have this endpoint
    return null;
    
    /* // TODO: Uncomment when backend implements this
    try {
      const response = await api.put(`/user/conversations/${conversationId}/mark-read`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Mark as read not implemented yet:', error.message);
      return null;
    }
    */
  }
};

export default messageService;