import api from './api';

const landlordService = {
  // ===== ROOM MANAGEMENT =====
  
  /**
   * Get all rooms owned by the current landlord
   * Backend: GET /api/landlord/rooms
   * Note: Endpoint needs to be added to backend (see backend section below)
   */
  async getMyRooms() {
    const response = await api.get('/landlord/rooms');
    return response.data;
  },

  /**
   * Create a new room with media files
   * Backend: POST /api/landlord/rooms (multipart/form-data)
   * 
   * FormData fields must match LandlordController parameter names:
   * - title, description, rentPricePerMonth, minimumStayMonths
   * - address, latitude, longitude
   * - numberOfToilets, numberOfBedRooms, hasWindow
   * - thumbnail (single file)
   * - images (array of files, max 3)
   * - videos (array of files, max 2)
   * - documents (array of files, max 3)
   */
  async createRoom(formData) {
    const response = await api.post('/landlord/rooms', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Update room with info and media
   * Backend: PUT /api/landlord/rooms/{roomId} (multipart/form-data)
   * 
   * FormData fields must match LandlordController parameter names:
   * - All basic fields (same as createRoom)
   * - status (optional: DRAFT, PUBLISHED, HIDDEN)
   * - imagesToRemove, videosToRemove, documentsToRemove (arrays of URLs)
   * - replaceThumbnail (boolean)
   * - New media files to add
   */
  async updateRoom(roomId, formData) {
    const response = await api.put(`/landlord/rooms/${roomId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Delete a room
   * Backend: DELETE /api/landlord/rooms/{roomId}
   * Note: Endpoint needs to be added to backend
   */
  async deleteRoom(roomId) {
    const response = await api.delete(`/landlord/rooms/${roomId}`);
    return response.data;
  }
};

export default landlordService;