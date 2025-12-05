// FE/src/utils/aiSessionManager.js

const AI_SESSION_KEY = 'broomate_ai_compatibility';

export const aiSessionManager = {
  /**
   * Save compatibility result to sessionStorage
   */
  saveResult: (tenantId, data) => {
    const session = {
      tenantId,
      score: data.Score,
      reason: data.ReasonBulletPoints || [],
      questions: data.questions || [],
      answers: data.answers || [],
      timestamp: Date.now(),
    };
    sessionStorage.setItem(`${AI_SESSION_KEY}_${tenantId}`, JSON.stringify(session));
    console.log('💾 Saved AI result for tenant:', tenantId);
  },

  /**
   * Load cached compatibility result
   */
  loadResult: (tenantId) => {
    const data = sessionStorage.getItem(`${AI_SESSION_KEY}_${tenantId}`);
    if (!data) return null;

    const session = JSON.parse(data);
    const ONE_HOUR = 60 * 60 * 1000;

    // Invalidate if older than 1 hour
    if (Date.now() - session.timestamp > ONE_HOUR) {
      console.log('⏰ AI result expired for tenant:', tenantId);
      aiSessionManager.clearResult(tenantId);
      return null;
    }

    console.log('✅ Loaded cached AI result for tenant:', tenantId);
    return session;
  },

  /**
   * Clear specific tenant's result
   */
  clearResult: (tenantId) => {
    sessionStorage.removeItem(`${AI_SESSION_KEY}_${tenantId}`);
    console.log('🗑️ Cleared AI result for tenant:', tenantId);
  },

  /**
   * Clear all AI results
   */
  clearAll: () => {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith(AI_SESSION_KEY)) {
        sessionStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cleared all AI results');
  },
};

export default aiSessionManager;