# Render Free Tier Setup Guide

## Health Check Configuration

Để đảm bảo server không bị sleep trên Render free tier, cần setup health check:

### 1. Trong Render Dashboard:
- Vào **Settings** của service
- Tìm **Health Check Path**: `/health` hoặc `/ping`
- Health Check Interval: `30` seconds (hoặc tối thiểu)

### 2. Hoặc sử dụng external service để ping:
Có thể dùng các service miễn phí như:
- **UptimeRobot** (https://uptimerobot.com): Ping `/health` mỗi 5 phút
- **Cron-job.org**: Setup cron job để call `/health` endpoint

### 3. Health Check Endpoints:
- `GET /health` - Returns server status
- `GET /ping` - Simple ping/pong response

### 4. CORS Configuration:
- Preflight cache: **24 hours** (giảm số lần CORS check)
- Server timeout: **4 minutes** (240 seconds)
- Allowed origins đã được cấu hình sẵn

## Testing

Sau khi deploy, test các endpoints:
```bash
# Health check
curl https://broomate.onrender.com/health

# Ping
curl https://broomate.onrender.com/ping

# CORS test
curl -X OPTIONS https://broomate.onrender.com/api/auth/login \
  -H "Origin: https://broomate.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

## Notes

- Render free tier có thể sleep sau 15 phút không có traffic
- Health check sẽ giữ server luôn sẵn sàng
- CORS preflight được cache 24h để giảm overhead
- Server timeout được set 4 phút để đảm bảo requests không bị timeout quá nhanh

