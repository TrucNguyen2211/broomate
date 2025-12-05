// ai.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); 

// Import các Router đã tạo
const imageRouter = require('./image.router.js');
const scoreRouter = require('./score.router.js');

const app = express();
// Đặt cổng mặc định là 3001 (hoặc đọc từ env)
const PORT = process.env.PORT || 3001; 

// CORS
const corsOptions = {
  origin: true,          // cho phép mọi origin (Vercel sẽ tự trả đúng Origin)
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle OPTIONS preflight

// Body Parser
app.use(bodyParser.json());

// --- ROUTE ATTACHMENT ---
// Lúc này FE baseURL = https://broomateai.vercel.app/api
// nên ở đây PHẢI mount dưới '/api'
app.use('/api', imageRouter);
app.use('/api', scoreRouter);

// --- SERVER STARTUP ---
// Only start server if not running as Vercel serverless function
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`\n✅ Unified Server is running securely on http://localhost:${PORT}`);
        console.log(`\nEndpoints available on Port ${PORT}:`);
        console.log(`  POST /api/verify-image`);
        console.log(`  POST /api/questions`);
        console.log(`  POST /api/score`);
        console.log(`  POST /api/followup-questions`);
    });
}

// Export app for Vercel serverless functions
module.exports = app;
