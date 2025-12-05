// AI/ai.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); 

const imageRouter = require('./image.router.js');
const scoreRouter = require('./score.router.js');

const app = express();
const PORT = process.env.PORT || 3001; 

// --- 1. CẤU HÌNH CORS CHUẨN ---
// Cho phép preflight và credentials
const corsOptions = {
  origin: true, // Reflection: cho phép mọi origin gọi vào (development/testing)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight cho tất cả routes

app.use(bodyParser.json());

// --- 2. MOUNT ROUTES VỚI PREFIX '/api' ---
// Quan trọng: Vì Vercel gửi request dạng '/api/xxx', ta phải hứng ở '/api'
app.get('/api/debug-cors', (req, res) => {
  res.json({
    ok: true,
    message: "CORS is working check",
    url: req.url,
    origin: req.headers.origin || "No origin header",
  });
});

// Mount router con vào /api
app.use('/api', imageRouter); // -> /api/verify-image
app.use('/api', scoreRouter); // -> /api/questions, /api/score

// Handler cho root (Health check)
app.get('/', (req, res) => {
    res.send("Broomate AI Service is running.");
});

// --- 3. SERVER STARTUP ---
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`\n✅ Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;