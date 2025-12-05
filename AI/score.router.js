// AI/score.router.js

const express = require('express');
const router = express.Router();
require('dotenv').config();

const TEST_MODE = process.env.TEST_MODE === 'true';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use flash for speed, or pro for better reasoning if available
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ==========================================
// CONFIGURATION & HELPERS
// ==========================================

console.log('============================================');
console.log('🚀 AI ROUTER STARTED');
console.log('   Model:', GEMINI_MODEL);
console.log('   Mode:', TEST_MODE ? '🧪 TEST' : '🌐 LIVE');
console.log('============================================');

/**
 * Standard Configuration for Gemini
 * Forces JSON output and disables safety blocks
 */
const COMMON_CONFIG = {
  safetySettings: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
  ],
  generationConfig: { 
    temperature: 0.8, // Slightly creative for better questions
    maxOutputTokens: 2000,
    response_mime_type: "application/json" // FORCE JSON OUTPUT
  }
};

/**
 * Clean and Parse JSON from AI response
 */
function cleanAndParseJSON(text) {
  try {
    if (!text) return null;
    const cleanText = text.trim().replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("⚠️ JSON Parse Failed. Raw text:", text);
    return null; 
  }
}

/**
 * Fetch Wrapper with Retry (Exponential Backoff)
 */
async function fetchWithBackoff(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      const responseText = await response.text();

      if (!response.ok) {
        let errorDetails;
        try { errorDetails = JSON.parse(responseText); } 
        catch { errorDetails = { message: responseText }; }
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorDetails)}`);
      }
      return JSON.parse(responseText);
    } catch (error) {
      console.error(`❌ Attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

// ==========================================
// 1. ROUTE: /questions
// Logic: 3 Context-Aware Questions + 2 Critical Conflict Questions
// ==========================================
router.post('/questions', async (req, res) => {
  console.log('📨 Received /questions');

  if (TEST_MODE) {
    return res.json({
      Type: "Question",
      Question: [
        "I see you both like gaming, how do you manage noise at night?",
        "Since User A cooks and User B cleans, how should we split the duties?",
        "You both mentioned being introverts, do you prefer a quiet home environment?",
        "User A sleeps late while User B wakes early (Sleep Schedule), how will you manage this?",
        "User A has a higher budget (Financial), how will you split shared utility bills?"
      ]
    });
  }

  try {
    const { client1Data, client2Data } = req.body;
    if (!client1Data || !client2Data) return res.status(400).json({ error: 'Missing required fields' });

    const systemInstruction = {
      parts: [{
        text: `You are an expert Roommate Matchmaker. 
        Your goal is to generate 5 insightful questions in English to help two users assess their compatibility.
        
        STRUCTURE OF THE 5 QUESTIONS:
        1. First 3 Questions (Context-Aware): Look for specific hobbies, personality traits, or keywords in their profiles. Ask about similarities or interesting details.
        2. Last 2 Questions (Conflict-Check): Analyze these 5 critical categories: [Sleep schedule, Cleanliness, Noise tolerance, Guests, Financial habits]. Identify the TOP 2 categories where they seem most DIFFERENT or where information is missing, and ask about those.`
      }]
    };

    const prompt = `
      User A Profile: "${client1Data}"
      User B Profile: "${client2Data}"

      TASK: Generate exactly 5 conversational questions in English.
      
      GUIDELINES:
      - Questions 1-3: Focus on specific details found in the text (e.g., "User A mentioned a cat...", "You both like coding...").
      - Questions 4-5: Focus on the biggest potential conflicts among: Sleep, Cleanliness, Noise, Guests, Money.
      - Tone: Helpful, neutral, and direct.

      REQUIRED OUTPUT JSON FORMAT:
      {
        "Type": "Question",
        "Question": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
      }
    `;

    const result = await fetchWithBackoff(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: systemInstruction,
        contents: [{ parts: [{ text: prompt }] }],
        ...COMMON_CONFIG
      })
    });

    // Fallback if AI fails
    if (!result.candidates || !result.candidates[0]) {
      console.error("❌ Gemini NO RESPONSE for /questions");
      return res.json({
        Type: "Question",
        Question: [
          "What are your hobbies and how do you spend your free time at home?",
          "How would you describe your personality in a shared living space?",
          "Do you have any pet peeves that your roommate should know about?",
          "How do your sleep schedules compare? (Early bird vs Night owl)",
          "How should we handle shared expenses and cleaning duties?"
        ]
      });
    }

    const data = cleanAndParseJSON(result.candidates[0].content.parts[0].text);
    res.json(data || { error: "Failed to parse AI response" });

  } catch (error) {
    console.error('❌ Error /questions:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// 2. ROUTE: /score
// Logic: Calculate Compatibility (0-100) + English Reasons
// ==========================================
router.post('/score', async (req, res) => {
  console.log('📨 Received /score');

  if (TEST_MODE) {
    return res.json({ 
      Type: "Result", 
      Score: 85, 
      ReasonBulletPoints: ["Similar sleep schedules.", "Both value cleanliness.", "Budget aligned."] 
    });
  }

  try {
    const { client1Data, client2Data, historyString } = req.body;
    if (!client1Data || !client2Data) return res.status(400).json({ error: 'Missing data' });

    const systemInstruction = {
      parts: [{
        text: `You are a Compatibility Scoring Algorithm.
        Analyze User A, User B, and their Conversation History.
        Calculate a score (0-100) based on shared habits and conflict resolution.
        Output in JSON only.`
      }]
    };

    const prompt = `
      Profile A: "${client1Data}"
      Profile B: "${client2Data}"
      Conversation History: "${historyString || 'No conversation yet'}"

      TASK: 
      1. Calculate a compatibility score (0-100).
      2. Provide 3-5 short bullet points explaining the pros/cons in English.
      
      REQUIRED OUTPUT JSON FORMAT:
      {
        "Type": "Result",
        "Score": 75,
        "ReasonBulletPoints": ["Reason 1", "Reason 2", "Reason 3"]
      }
    `;

    const result = await fetchWithBackoff(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: systemInstruction,
        contents: [{ parts: [{ text: prompt }] }],
        ...COMMON_CONFIG
      })
    });

    if (!result.candidates || !result.candidates[0]) {
      console.error("❌ Gemini NO RESPONSE for /score");
      return res.json({
        Type: "Result",
        Score: 60,
        ReasonBulletPoints: [
          "Insufficient data for detailed analysis.",
          "Some common interests detected.",
          "Please discuss living habits further."
        ]
      });
    }

    const data = cleanAndParseJSON(result.candidates[0].content.parts[0].text);
    res.json(data || { error: "Failed to parse AI response" });

  } catch (error) {
    console.error('❌ Error /score:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// 3. ROUTE: /followup-questions
// Logic: Clarify Ambiguities based on History
// ==========================================
router.post('/followup-questions', async (req, res) => {
  console.log('📨 Received /followup-questions');

  if (TEST_MODE) {
    return res.json({ Type: "Question", Question: ["Mock Followup Question?"] });
  }

  try {
    const { client1Data, client2Data, historyString, currentScore } = req.body;

    const systemInstruction = {
      parts: [{
        text: `You are a Conflict Resolution Bot.
        Your goal is to find unclear areas in the conversation history and ask 1-3 clarifying questions in English.
        Output in JSON only.`
      }]
    };

    const prompt = `
      Profile A: "${client1Data}"
      Profile B: "${client2Data}"
      Chat History: "${historyString}"
      Current Score: ${currentScore}

      TASK: Identify what is still unclear or conflicting in their discussion.
      Generate 1 to 3 followup questions in English to resolve these issues.

      REQUIRED OUTPUT JSON FORMAT:
      {
        "Type": "Question",
        "Question": ["Question 1", "Question 2"]
      }
    `;

    const result = await fetchWithBackoff(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: systemInstruction,
        contents: [{ parts: [{ text: prompt }] }],
        ...COMMON_CONFIG
      })
    });

    if (!result.candidates || !result.candidates[0]) {
      console.error("❌ Gemini NO RESPONSE for /followup-questions");
      return res.json({
        Type: "Question",
        Question: ["Is there anything else you'd like to discuss regarding house rules?"]
      });
    }

    const data = cleanAndParseJSON(result.candidates[0].content.parts[0].text);
    res.json(data || { error: "Failed to parse AI response" });

  } catch (error) {
    console.error('❌ Error /followup-questions:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;