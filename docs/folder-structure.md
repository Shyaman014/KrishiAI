# KrishiAI – Folder Structure

```
KrishiAI/
│
├── .gitignore                  # Root git ignore rules
├── .env.example                # Points to per-service env examples
├── package.json                # Root convenience scripts
├── README.md                   # Project overview & setup guide
│
├── client/                     # React + Vite + TypeScript frontend
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── components.json         # shadcn/ui configuration
│   ├── .env.example
│   └── src/
│       ├── main.tsx            # App entry – QueryClient + RouterProvider
│       ├── index.css           # Global styles & CSS custom properties
│       ├── router.tsx          # React Router route definitions
│       ├── components/
│       │   └── ui/             # shadcn/ui primitive components
│       │       └── button.tsx
│       ├── hooks/              # Custom React hooks
│       │   └── useApiHealth.ts
│       ├── layouts/            # Page layout wrappers
│       │   └── RootLayout.tsx
│       ├── lib/                # Utilities & singletons
│       │   ├── api.ts          # Axios client with interceptors
│       │   ├── queryClient.ts  # TanStack Query client
│       │   └── utils.ts        # cn() helper
│       ├── pages/              # Route-level page components
│       │   ├── HomePage.tsx
│       │   └── NotFoundPage.tsx
│       └── types/              # Shared TypeScript types
│           └── index.ts
│
├── server/                     # Node.js + Express + TypeScript API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── server.ts           # Entry point – bootstrap & listen
│       ├── app.ts              # Express app factory
│       ├── config/
│       │   ├── env.ts          # Zod-validated env variables
│       │   ├── db.ts           # MongoDB connection
│       │   └── redis.ts        # Redis connection
│       ├── controllers/        # Request handlers
│       │   └── healthController.ts
│       ├── middleware/
│       │   ├── errorHandler.ts # Centralised error handler
│       │   ├── notFound.ts     # 404 catch-all
│       │   └── requestLogger.ts# Morgan → Winston
│       ├── models/             # Mongoose schemas (Phase 2+)
│       ├── routes/
│       │   ├── index.ts        # Root router (mounts all sub-routers)
│       │   └── healthRoutes.ts
│       ├── services/           # Business logic layer (Phase 2+)
│       └── utils/
│           └── logger.ts       # Winston logger
│
├── ai-service/                 # Python + FastAPI ML service
│   ├── main.py                 # Uvicorn runner entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── __init__.py
│       ├── main.py             # FastAPI app factory
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py       # Pydantic Settings
│       │   └── logging.py      # Logging setup
│       ├── models/             # Pydantic request/response schemas
│       │   ├── __init__.py
│       │   └── responses.py
│       ├── routers/            # FastAPI routers
│       │   ├── __init__.py
│       │   └── health.py
│       ├── services/           # ML inference services (Phase 2+)
│       │   └── __init__.py
│       └── utils/              # Shared helpers
│           └── __init__.py
│
└── docs/                       # Technical documentation
    ├── architecture.md
    ├── folder-structure.md     # (this file)
    └── api-communication.md
```