// src/services/authService.js
import api from './api';

const authService = {
  /**
   * Login user
   */
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  /**
   * Signup as tenant
   */
  async signupTenant(formData) {
    const response = await api.post('/auth/signup/tenant', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Signup as landlord
   */
  async signupLandlord(formData) {
    const response = await api.post('/auth/signup/landlord', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default authService;