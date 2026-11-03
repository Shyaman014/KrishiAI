# KrishiAI – API Communication

## Service URLs

| Service | Base URL |
|---------|----------|
| Frontend (dev) | `http://localhost:5173` |
| Express API | `http://localhost:5000` |
| FastAPI AI Service | `http://localhost:8000` |

---

## Client → Express API

All requests from the client go through the Vite dev proxy (`/api` → `http://localhost:5000`) in development. In production, the client uses `VITE_API_URL`.

### Health Check
```
GET /api/health

Response 200 (operational):
{
  "success": true,
  "status": "ok",
  "service": "krishi-ai-server",
  "version": "1.0.0",
  "timestamp": "2026-11-02T10:00:00.000Z",
  "checks": {
    "database": "connected",
    "cache": "connected"
  }
}

Response 206 (degraded – DB not connected):
{
  ...
  "status": "degraded",
  "checks": {
    "database": "disconnected",
    "cache": "connected"
  }
}
```

---

## Express API → FastAPI AI Service

The Express server calls the AI service for ML inference tasks (Phase 2+). The AI service URL is configured in `server/.env` via `AI_SERVICE_URL`.

```
POST http://localhost:8000/ai/<endpoint>
Authorization: (internal service key – Phase 2)
Content-Type: application/json
```

---

## FastAPI AI Service – Health Check
```
GET /health

Response 200:
{
  "success": true,
  "status": "ok",
  "service": "krishi-ai-service",
  "version": "1.0.0",
  "timestamp": "2026-11-02T10:00:00+00:00"
}
```

---

## Planned Phase 2 Endpoints

### Express API
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login / JWT issue |
| POST | `/api/crops/diagnose` | Trigger crop disease diagnosis via AI service |
| GET | `/api/crops/history` | User's diagnosis history |

### FastAPI AI Service
| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/diagnose` | ML crop disease inference |
| POST | `/ai/recommend` | Crop recommendation |
