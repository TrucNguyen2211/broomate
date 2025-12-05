// src/services/tenantService.js
import api from './api';

const tenantService = {
  // ===== PROFILES =====
  
  getProfiles: async () => {
    const response = await api.get('/tenant/profiles');
    return response.data;
  },

  // ✅ FIXED: Removed 's' from profiles to match backend
  getProfile: async (tenantId) => {
    const response = await api.get(`/tenant/profile/${tenantId}`);
    return response.data;
  },

  // ===== SWIPING =====
  
  swipe: async (targetTenantId, swipeAction) => {
    const response = await api.post('/tenant/swipe', {
      targetTenantId,
      swipeAction // 'ACCEPT' or 'REJECT'
    });
    return response.data;
  },

  // ===== MATCHES =====
  
  getMatches: async () => {
    const response = await api.get('/tenant/matches');
    return response.data;
  },

  // ===== BOOKMARKS =====
  
  getBookmarks: async () => {
    const response = await api.get('/tenant/bookmarks');
    return response.data;
  },

  addBookmark: async (roomId) => {
    const response = await api.post(`/tenant/bookmarks/rooms/${roomId}`, {});
    return response.data;
  },

  removeBookmark: async (roomId) => {
    const response = await api.delete(`/tenant/bookmarks/rooms/${roomId}`);
    return response.data;
  },

  // ===== LIKES RECEIVED =====
  
  getLikesReceived: async () => {
    const response = await api.get('/tenant/likes-received');
    return response.data;
  }
};

export default tenantService;