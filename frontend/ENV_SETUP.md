# Frontend Environment Variables Setup

## Cách setup để call API từ https://broomate.onrender.com

### 1. Tạo file `.env` trong thư mục `frontend/`

Tạo file `.env` với nội dung:

```env
# API Configuration
REACT_APP_API_BASE_URL=https://broomate.onrender.com/api

# WebSocket Configuration
REACT_APP_WS_BASE_URL=https://broomate.onrender.com

# AI Service URL
REACT_APP_AI_API_URL=https://broomateai.vercel.app/api
```

### 2. Cho Local Development

Nếu muốn test local, dùng:

```env
REACT_APP_API_BASE_URL=http://localhost:8080/api
REACT_APP_WS_BASE_URL=http://localhost:8080
```

### 3. Cho Production (Vercel)

Nếu deploy lên Vercel, cần set Environment Variables trong Vercel Dashboard:

1. Vào **Project Settings** → **Environment Variables**
2. Thêm các biến sau:

| Name | Value |
|------|-------|
| `REACT_APP_API_BASE_URL` | `https://broomate.onrender.com/api` |
| `REACT_APP_WS_BASE_URL` | `https://broomate.onrender.com` |
| `REACT_APP_AI_API_URL` | `https://broomateai.vercel.app/api` |

### 4. Restart Development Server

Sau khi tạo/sửa file `.env`, cần restart dev server:

```bash
# Stop server (Ctrl+C)
# Rồi start lại
npm start
```

### 5. Kiểm tra

Mở browser console và check:
- API calls sẽ gọi đến `https://broomate.onrender.com/api`
- WebSocket sẽ connect đến `https://broomate.onrender.com/ws`

## Lưu ý

- File `.env` đã được thêm vào `.gitignore` (không commit lên Git)
- Environment variables phải bắt đầu với `REACT_APP_` để React có thể đọc được
- Sau khi thay đổi `.env`, cần restart dev server

