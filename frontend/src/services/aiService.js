// FE/src/services/aiService.js

import axios from 'axios';

// ✅ AI Service URL (different from main backend)
const AI_API_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:3001/api';

const aiApi = axios.create({
  baseURL: AI_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================
// IMAGE VERIFICATION
// =====================================

/**
 * Verify if an image is original (not stolen/AI-generated)
 * @param {File} imageFile - The image file to verify
 * @returns {Promise} - { isOriginal, reason, stolen_check, ai_check, ... }
 */
export const verifyImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('imageFile', imageFile);

  const response = await axios.post(`${AI_API_URL}/verify-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// =====================================
// COMPATIBILITY MATCHING
// =====================================

/**
 * Generate initial compatibility questions
 * @param {Object} client1Data - Current user's profile data
 * @param {Object} client2Data - Target tenant's profile data
 * @returns {Promise} - { Type: "Question", Question: [...] }
 */
export const generateQuestions = async (client1Data, client2Data) => {
  const response = await aiApi.post('/questions', {
    client1Data: JSON.stringify(client1Data),
    client2Data: JSON.stringify(client2Data),
  });

  return response.data;
};

/**
 * Score compatibility based on Q&A
 * @param {Object} client1Data - Current user's profile data
 * @param {Object} client2Data - Target tenant's profile data
 * @param {string} historyString - Formatted Q&A history
 * @returns {Promise} - { Type: "Result", Score, ReasonBulletPoints: [...] }
 */
export const scoreCompatibility = async (client1Data, client2Data, historyString) => {
  const response = await aiApi.post('/score', {
    client1Data: JSON.stringify(client1Data),
    client2Data: JSON.stringify(client2Data),
    historyString,
  });

  return response.data;
};

/**
 * Generate follow-up questions for mid-range scores
 * @param {Object} client1Data - Current user's profile data
 * @param {Object} client2Data - Target tenant's profile data
 * @param {string} historyString - Formatted Q&A history
 * @param {number} currentScore - Current compatibility score
 * @returns {Promise} - { Type: "Question", Question: [...] }
 */
export const generateFollowUpQuestions = async (
  client1Data,
  client2Data,
  historyString,
  currentScore
) => {
  const response = await aiApi.post('/followup-questions', {
    client1Data: JSON.stringify(client1Data),
    client2Data: JSON.stringify(client2Data),
    historyString,
    currentScore,
  });

  return response.data;
};

export default {
  verifyImage,
  generateQuestions,
  scoreCompatibility,
  generateFollowUpQuestions,
};