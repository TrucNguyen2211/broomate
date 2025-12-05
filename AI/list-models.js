// AI/list-models.js (NEW FILE)

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LIST_MODELS_URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

async function listModels() {
  console.log('🔍 Fetching available Gemini models...');
  
  try {
    const response = await fetch(LIST_MODELS_URL);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Available Models:');
      data.models.forEach(model => {
        console.log(`   - ${model.name} (${model.displayName})`);
        console.log(`     Supports: ${model.supportedGenerationMethods.join(', ')}`);
      });
    } else {
      console.log('❌ Error:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

listModels();