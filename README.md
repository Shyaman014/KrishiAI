# KrishiAI 🌱

**AI-powered agricultural assistance platform** — helping farmers diagnose crop diseases, get weather insights, and access personalised agronomic advice.

---

## Project Structure

```
KrishiAI/
├── client/          # React + Vite + TypeScript frontend
├── server/          # Node.js + Express + TypeScript API
├── ai-service/      # Python + FastAPI ML service
├── docs/            # Architecture & technical documentation
├── package.json     # Root convenience scripts
└── .env.example     # Points to per-service env examples
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Python | ≥ 3.11 |
| pip | latest |
| MongoDB | Atlas or local |
| Redis | ≥ 7 |

---

## Installation

### 1. Clone the repository
```bash
git clone <repo-url>
cd KrishiAI
```

### 2. Set up environment variables
```bash
# Each service needs its own .env
cp client/.env.example   client/.env
cp server/.env.example   server/.env
cp ai-service/.env.example ai-service/.env
# Fill in real values in each .env file
```

### 3. Install dependencies

**Client & Server (from root):**
```bash
npm run install:all
```

**AI Service:**
```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

---

## Running the Services

| Service | Command | URL |
|---------|---------|-----|
| Frontend | `npm run dev:client` | http://localhost:5173 |
| Backend API | `npm run dev:server` | http://localhost:5000 |
| AI Service | `npm run dev:ai` | http://localhost:8000 |

Or start individually from each sub-directory:

```bash
# Frontend
cd client && npm run dev

# Backend
cd server && npm run dev

# AI Service
cd ai-service
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

---

## Health Checks

```bash
# Express API
curl http://localhost:5000/api/health

# FastAPI AI Service
curl http://localhost:8000/health
```

---

## Service Communication

```
Browser  ──►  client (5173)
              │
              ▼  REST
         server (5000)  ──►  MongoDB Atlas
              │          ──►  Redis
              │
              ▼  REST / HTTP
         ai-service (8000)
```

See [`docs/api-communication.md`](docs/api-communication.md) for full API contracts.

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) – System architecture overview
- [`docs/folder-structure.md`](docs/folder-structure.md) – Annotated folder tree
- [`docs/api-communication.md`](docs/api-communication.md) – Service API contracts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Routing | React Router v6 |
| API State | TanStack Query v5 |
| Backend | Node.js, Express.js, TypeScript |
| Validation | Zod (server), Pydantic (AI service) |
| AI Service | Python, FastAPI, PyTorch, Torchvision, OpenCV |
| Database | MongoDB Atlas + Mongoose |
| Cache | Redis |
| Image Storage | Cloudinary |
| Logging | Winston (server), Python logging (AI service) |
