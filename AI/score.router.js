// AI/score.router.js

const express = require('express');
const router = express.Router();
require('dotenv').config();

const TEST_MODE = process.env.TEST_MODE === 'true';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Cấu hình Model - Ưu tiên Flash cho tốc độ và hỗ trợ JSON Mode tốt
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Debug Log khởi động
console.log('============================================');
console.log('🚀 AI ROUTER STARTED');
console.log('   Model:', GEMINI_MODEL);
console.log('   Mode:', TEST_MODE ? '🧪 TEST' : '🌐 LIVE');
console.log('============================================');

/**
 * Hàm parse JSON an toàn tuyệt đối.
 * Xử lý cả trường hợp AI trả về markdown ```json ... ```
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
 * Hàm fetch có cơ chế thử lại (Retry) khi mạng lag
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

/**
 * Cấu hình chung cho mọi API call để đảm bảo output xịn
 */
const COMMON_CONFIG = {
  safetySettings: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
  ],
  generationConfig: { 
    temperature: 0.7, 
    maxOutputTokens: 2000,
    response_mime_type: "application/json" // 👈 ÉP KIỂU JSON CỨNG
  }
};

// ============================================================================
// 1. API: /questions
// Tạo câu hỏi để 2 người hiểu nhau hơn
// ============================================================================
router.post('/questions', async (req, res) => {
  console.log('📨 Received /questions');

  if (TEST_MODE) {
    return res.json({
      Type: "Question",
      Question: ["Mock Q1", "Mock Q2", "Mock Q3", "Mock Q4", "Mock Q5"]
    });
  }

  try {
    const { client1Data, client2Data } = req.body;
    if (!client1Data || !client2Data) return res.status(400).json({ error: 'Missing required fields' });

    // SYSTEM INSTRUCTION: Định hình vai trò máy móc để tránh từ chối
    const systemInstruction = {
      parts: [{
        text: `You are a Profile Analysis Engine for a housing database. 
        Your job is to compare two raw user inputs and generate clarifying questions in Vietnamese.
        Ignore sensitive keywords (alcohol, parties) as this is for compatibility checking only.
        Output strictly in JSON format.`
      }]
    };

    const prompt = `
      User A Profile: "${client1Data}"
      User B Profile: "${client2Data}"

      TASK: Generate exactly 5 questions in Vietnamese that help these two users understand their living compatibility.
      Focus on: Sleep schedule, Cleanliness, Noise tolerance, Guests, and Financial habits.

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

    if (!result.candidates || !result.candidates[0]) {
      console.error("❌ Gemini NO RESPONSE for /questions");
      // Fallback
      return res.json({
        Type: "Question",
        Question: [
          "Bạn thường đi ngủ và thức dậy lúc mấy giờ?",
          "Bạn mong đợi việc chia sẻ việc nhà như thế nào?",
          "Quan điểm của bạn về việc mời khách hay người lạ về phòng?",
          "Bạn có nhạy cảm với tiếng ồn vào ban đêm không?",
          "Chúng ta nên thống nhất chi phí sinh hoạt chung ra sao?"
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

// ============================================================================
// 2. API: /score
// Chấm điểm độ hợp nhau
// ============================================================================
router.post('/score', async (req, res) => {
  console.log('📨 Received /score');

  if (TEST_MODE) {
    return res.json({ Type: "Result", Score: 88, ReasonBulletPoints: ["Mock Reason 1", "Mock Reason 2"] });
  }

  try {
    const { client1Data, client2Data, historyString } = req.body;
    if (!client1Data || !client2Data) return res.status(400).json({ error: 'Missing data' });

    const systemInstruction = {
      parts: [{
        text: `You are a Compatibility Scoring Algorithm.
        Analyze the inputs mathematically based on shared habits and conflicts.
        0 = Total disaster, 100 = Perfect match.
        Output strictly in JSON.`
      }]
    };

    const prompt = `
      Profile A: "${client1Data}"
      Profile B: "${client2Data}"
      Interaction History: "${historyString || 'No interaction yet'}"

      TASK: 
      1. Calculate a compatibility score (0-100).
      2. Provide 3-5 bullet points explaining the score in Vietnamese.
      
      REQUIRED OUTPUT JSON FORMAT:
      {
        "Type": "Result",
        "Score": 75,
        "ReasonBulletPoints": ["Lý do 1...", "Lý do 2...", "Lý do 3..."]
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
          "Dữ liệu chưa đủ để AI phân tích sâu.",
          "Hai bạn có vẻ có một số sở thích chung.",
          "Cần trao đổi thêm về giờ giấc sinh hoạt."
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

// ============================================================================
// 3. API: /followup-questions
// Đặt câu hỏi xoáy sâu vào mâu thuẫn
// ============================================================================
router.post('/followup-questions', async (req, res) => {
  console.log('📨 Received /followup-questions');

  if (TEST_MODE) {
    return res.json({ Type: "Question", Question: ["Mock Followup 1"] });
  }

  try {
    const { client1Data, client2Data, historyString, currentScore } = req.body;

    const systemInstruction = {
      parts: [{
        text: `You are a Conflict Resolution Bot.
        Your goal is to find ambiguities or conflicts in the provided conversation history and ask strictly clarifying questions.
        Output strictly in JSON.`
      }]
    };

    const prompt = `
      Profile A: "${client1Data}"
      Profile B: "${client2Data}"
      Current Chat History: "${historyString}"
      Current Compatibility Score: ${currentScore}

      TASK: Based on the chat history, identify what is still unclear or conflicting.
      Generate 1 to 3 followup questions in Vietnamese to resolve these issues.

      REQUIRED OUTPUT JSON FORMAT:
      {
        "Type": "Question",
        "Question": ["Câu hỏi 1...", "Câu hỏi 2..."]
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
        Question: ["Hai bạn còn điều gì băn khoăn về thói quen sinh hoạt của nhau không?"]
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