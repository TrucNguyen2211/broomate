const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); 

// Import các Router đã tạo
const imageRouter = require('./image.router.js');
const scoreRouter = require('./score.router.js');

const app = express();
// Đặt cổng mặc định là 3000 (hoặc đọc từ env)
const PORT = process.env.PORT || 3001; 

// AI/ai.js - Add after line 13
const corsOptions = {
  origin: [
    'http://localhost:3000',  // React dev server
    'http://localhost:8080'   // Spring Boot (if needed)
  ],
  credentials: true
};

app.use(cors(corsOptions));

// 2. Body Parser: Cần thiết cho các request JSON (từ scoreRouter)
app.use(bodyParser.json());

// 3. Static files: Tùy chọn, nếu bạn phục vụ file tĩnh

// --- ROUTE ATTACHMENT ---
// Gắn Image Router vào đường dẫn '/api'
// -> Các route sẽ là /api/verify-image
app.use('/api', imageRouter);

// Gắn Score Router vào đường dẫn '/api'
// -> Các route sẽ là /api/v1/questions, /api/v1/score, /api/v1/followup-questions
// Lưu ý: Score Router đã có tiền tố '/v1' bên trong, nên ở đây chỉ cần '/api'
app.use('/api', scoreRouter); 

// --- SERVER STARTUP ---
app.listen(PORT, () => {
    console.log(`\n✅ Unified Server is running securely on http://localhost:${PORT}`);
    console.log(`\nEndpoints available on Port ${PORT}:`);
    console.log(`  POST /api/verify-image (Image Verification)`);
    console.log(`  POST /api/v1/questions (Score & Questions)`);
    console.log(`  POST /api/v1/score (Score & Questions)`);
});