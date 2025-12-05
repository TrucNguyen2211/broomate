// AI/score.router.js

const express = require('express');
const router = express.Router();
require('dotenv').config();

const TEST_MODE = process.env.TEST_MODE === 'true';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Hãy dùng dynamic như này:
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'; // Fallback an toàn
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
// ✅ ADD THESE DEBUG LOGS
console.log('🔍 Environment Variables:');
console.log('   PORT:', process.env.PORT);
console.log('   TEST_MODE (raw):', process.env.TEST_MODE);
console.log('   TEST_MODE (boolean):', TEST_MODE);
console.log('   GEMINI_API_KEY:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 20) + '...' : 'NOT SET')
console.log('   GEMINI_MODEL:', GEMINI_MODEL);

if (TEST_MODE) {
  console.log('🧪 TEST MODE ENABLED - Using mock data instead of Gemini API');
} else {
  console.log('🌐 LIVE MODE - Will call Gemini API');
}

async function fetchWithBackoff(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      const responseText = await response.text();

      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = JSON.parse(responseText);
        } catch {
          errorDetails = { message: responseText };
        }
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

router.post('/questions', async (req, res) => {
  console.log('📨 Received /questions request');

  if (TEST_MODE) {
    console.log('🧪 TEST MODE: Returning mock questions');
    return res.json({
      Type: "Question",
      Question: [
        "What time do you usually go to bed and wake up on weekdays?",
        "How often do you have guests over, and what's your policy on overnight guests?",
        "How do you prefer to handle household chores - should we create a cleaning schedule?",
        "What are your thoughts on noise levels during evening hours (after 9 PM)?",
        "How do you feel about sharing kitchen supplies and groceries?"
      ]
    });
  }

  try {
    const { client1Data, client2Data } = req.body;

    if (!client1Data || !client2Data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `You are an AI assistant helping two potential roommates in Vietnam assess their compatibility. 

Client 1 Data: ${client1Data}
Client 2 Data: ${client2Data}

Generate exactly 5 conversational questions focused on Vietnamese living habits. Return ONLY valid JSON:
{"Type":"Question","Question":["Q1","Q2","Q3","Q4","Q5"]}`;

    const result = await fetchWithBackoff(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    });

    const text = result.candidates[0].content.parts[0].text.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    res.json(JSON.parse(text));
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'API Error', message: error.message });
  }
});

router.post('/score', async (req, res) => {
  console.log('📨 Received /score request');

  if (TEST_MODE) {
    console.log('🧪 TEST MODE: Returning mock score');
    return res.json({
      Type: "Result",
      Score: Math.floor(Math.random() * 30) + 60,
      ReasonBulletPoints: [
        "Both prefer quiet evenings after 10 PM",
        "Similar cleanliness standards mentioned",
        "Budget alignment shows financial compatibility",
        "Different schedules reduce shared space conflicts",
        "Both value privacy with occasional socializing"
      ]
    });
  }

  try {
    const { client1Data, client2Data, historyString } = req.body;

    if (!client1Data || !client2Data || !historyString) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `Evaluate roommate compatibility (0-100 score):

Client 1: ${client1Data}
Client 2: ${client2Data}
Q&A: ${historyString}

Return ONLY valid JSON:
{"Type":"Result","Score":75,"ReasonBulletPoints":["Reason 1","Reason 2","Reason 3"]}`;

    const result = await fetchWithBackoff(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    });

    const text = result.candidates[0].content.parts[0].text.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    res.json(JSON.parse(text));
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'API Error', message: error.message });
  }
});

router.post('/followup-questions', async (req, res) => {
  console.log('📨 Received /followup-questions request');

  if (TEST_MODE) {
    console.log('🧪 TEST MODE: Returning mock follow-up questions');
    return res.json({
      Type: "Question",
      Question: [
        "Can you clarify your expectations around quiet hours on weekends?",
        "How would you handle situations where cleaning schedules aren't followed?"
      ]
    });
  }

  try {
    const { client1Data, client2Data, historyString, currentScore } = req.body;

    const prompt = `Generate 1-3 clarifying questions:

Client 1: ${client1Data}
Client 2: ${client2Data}
History: ${historyString}
Current Score: ${currentScore}

Return ONLY valid JSON:
{"Type":"Question","Question":["Q1","Q2"]}`;

    const result = await fetchWithBackoff(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
      })
    });

    const text = result.candidates[0].content.parts[0].text.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    res.json(JSON.parse(text));
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'API Error', message: error.message });
  }
});

module.exports = router;
