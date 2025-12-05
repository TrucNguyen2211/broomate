# Deploy AI Service lên Vercel

## Bước 1: Chuẩn bị

1. Đảm bảo đã có tất cả dependencies:
```bash
cd AI
npm install
```

2. Kiểm tra các environment variables cần thiết:
- `GOOGLE_VISION_KEY_PATH` - Google Vision API credentials (JSON string)
- `GEMINI_API_KEY` - Gemini API key
- `TEST_MODE` (optional) - Set to "true" để test mode

## Bước 2: Deploy lên Vercel

### Cách 1: Deploy qua Vercel CLI

```bash
# Install Vercel CLI (nếu chưa có)
npm i -g vercel

# Login vào Vercel
vercel login

# Deploy từ thư mục AI
cd AI
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Chọn account của bạn
# - Link to existing project? No (lần đầu) hoặc Yes (nếu đã có)
# - Project name? broomate-ai (hoặc tên bạn muốn)
# - Directory? ./
```

### Cách 2: Deploy qua Vercel Dashboard

1. Vào https://vercel.com/dashboard
2. Click **Add New Project**
3. Import Git repository (nếu code đã push lên Git)
4. Hoặc upload folder `AI/` trực tiếp
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `AI` (nếu deploy từ root repo) hoặc `.` (nếu deploy riêng)
   - **Build Command**: (để trống)
   - **Output Directory**: (để trống)
   - **Install Command**: `npm install`

## Bước 3: Set Environment Variables

Trong Vercel Dashboard → Project Settings → Environment Variables:

| Name | Value | Description |
|------|-------|-------------|
| `GOOGLE_VISION_KEY_PATH` | `{...JSON...}` | Google Vision API credentials (paste toàn bộ JSON) |
| `GEMINI_API_KEY` | `your-gemini-key` | Gemini API key |
| `TEST_MODE` | `false` | Set true để test mode |

**Lưu ý**: 
- `GOOGLE_VISION_KEY_PATH` phải là JSON string (paste toàn bộ content của service account JSON file)
- Sau khi set env vars, cần **Redeploy** để apply

## Bước 4: Update Frontend

Sau khi deploy, bạn sẽ có URL như: `https://broomate-ai.vercel.app`

Update file `frontend/.env`:
```env
REACT_APP_AI_API_URL=https://broomate-ai.vercel.app/api
```

Hoặc trong Vercel Dashboard của frontend project, thêm:
- `REACT_APP_AI_API_URL` = `https://broomate-ai.vercel.app/api`

## Bước 5: Test

Sau khi deploy, test các endpoints:

```bash
# Test image verification
curl -X POST https://broomate-ai.vercel.app/api/verify-image \
  -F "imageFile=@test-image.jpg"

# Test questions endpoint
curl -X POST https://broomate-ai.vercel.app/api/v1/questions \
  -H "Content-Type: application/json" \
  -d '{"client1Data": {...}, "client2Data": {...}}'
```

## Cấu trúc Files

```
AI/
├── api/
│   └── index.js          # Vercel serverless function wrapper
├── ai.js                 # Main Express app
├── image.router.js       # Image verification routes
├── score.router.js       # Score & questions routes
├── vercel.json           # Vercel configuration
├── package.json
└── VERCELL_DEPLOY.md     # This file
```

## Troubleshooting

### Lỗi: "Cannot find module"
- Đảm bảo `package.json` có đầy đủ dependencies
- Chạy `npm install` trước khi deploy

### Lỗi: "Function timeout"
- Vercel free tier có timeout 10s
- Nếu cần timeout dài hơn, upgrade plan hoặc optimize code

### Lỗi: "Environment variable not found"
- Kiểm tra đã set env vars trong Vercel Dashboard
- Redeploy sau khi set env vars

### Lỗi: CORS
- Đã update CORS trong `ai.js` để cho phép frontend và backend domains
- Nếu vẫn lỗi, check domain trong `corsOptions`

## Notes

- Vercel sẽ tự động detect Express app và wrap thành serverless function
- File `api/index.js` là entry point cho Vercel
- App sẽ không chạy `app.listen()` khi deploy trên Vercel (check `VERCEL` env)

