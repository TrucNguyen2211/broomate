// src/services/roomService.js
import api from './api';

const roomService = {
  // Get all rooms - unwrap the RoomListResponse
  getAllRooms: async () => {
    const response = await api.get('/user/rooms');
    // Backend returns { rooms: [...], totalCount: 50, message: "..." }
    // Extract just the rooms array
    return response.data.rooms || [];
  },

  // Get room by ID
  getRoomById: async (roomId) => {
    const response = await api.get(`/user/rooms/${roomId}`);
    return response.data;
  },

  // Search/filter rooms (if you add backend filtering later)
  searchRooms: async (filters) => {
    const response = await api.get('/user/rooms', {
      params: filters
    });
    return response.data.rooms || [];
  }
};

export default roomService;