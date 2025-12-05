// AI/test-gemini.js

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function testGemini() {
  console.log('🧪 Testing Gemini API...');
  console.log('🔑 API Key:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 20) + '...' : 'NOT FOUND');

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say hello in one sentence'
          }]
        }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log('📝 Response:', data.candidates[0].content.parts[0].text);
    } else {
      console.log('❌ ERROR!');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

testGemini();