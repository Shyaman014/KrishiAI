# KrishiAI – Architecture Document

## Overview

KrishiAI is a three-tier, service-oriented platform consisting of:

1. **Client** – React SPA served by Vite dev server (port 5173)
2. **Server** – Node.js/Express REST API (port 5000)
3. **AI Service** – Python/FastAPI ML inference service (port 8000)

Each service is independently deployable and communicates over HTTP/REST.

---

## Service Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Client                         │
│              React + Vite + TypeScript (port 5173)              │
│                                                                   │
│  ┌──────────────────┐   ┌─────────────────────────────────────┐ │
│  │  TanStack Query  │   │         React Router v6             │ │
│  └──────────────────┘   └─────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST (Axios, /api/*)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Express API Server (port 5000)                   │
│              Node.js + TypeScript + Zod                          │
│                                                                   │
│  Middleware: helmet, cors, rate-limit, morgan, express.json      │
│  Layers: routes → controllers → services → models               │
│                                                                   │
│ ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│ │  MongoDB Atlas   │  │  Redis Cache     │  │  Cloudinary    │ │
│ │  (Mongoose)      │  │  (ioredis)       │  │  (future)      │ │
│ └──────────────────┘  └──────────────────┘  └────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST (httpx, future)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                FastAPI AI Service (port 8000)                     │
│              Python + Pydantic + uvicorn                         │
│                                                                   │
│  Layers: routers → services → ML models (PyTorch, Phase 2+)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Frontend framework | React 18 | Mature ecosystem, excellent TypeScript support |
| Build tool | Vite | Fast HMR, native ESM |
| Styling | Tailwind CSS + shadcn/ui | Rapid prototyping with accessible primitives |
| API state | TanStack Query v5 | Caching, optimistic updates, background refetch |
| Routing | React Router v6 | Nested routes, data loading |
| Backend runtime | Node.js 18 + Express | Lightweight, wide library support |
| Validation | Zod (server) / Pydantic (AI) | Runtime type safety |
| Database | MongoDB Atlas | Flexible schema for agricultural data |
| Cache | Redis | Session store, rate-limit counter, result cache |
| ML service | Python + FastAPI | Best ML ecosystem, async-first framework |
| Logging | Winston (Node) / stdlib logging (Python) | Structured logs |

---

## Security Measures

- `helmet()` sets secure HTTP headers
- CORS restricted to allowed origin list
- Rate limiting: 200 req / 15 min per IP on `/api/*`
- Environment variables validated at startup with Zod / Pydantic
- JWT authentication planned for Phase 2
- No credentials committed to VCS (`.gitignore` covers `.env`)
