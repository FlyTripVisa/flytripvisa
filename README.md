# FlyTripVisa-App: Architectural Blueprint

## 1. Project Overview
**FlyTripVisa-App** is a serverless, high-concurrency travel and visa processing platform deployed on Cloudflare Workers. It integrates edge computing with D1 (SQL) for structured data, R2 (Object Storage) for assets, and KV (Key-Value) for ultra-fast cache.

## 2. Technical Stack
- **Runtime:** Cloudflare Workers (Node.js Compatibility Mode).
- **Database:** D1 (SQLite) - Manages visa records, user requests, and administrative data.
- **Object Storage:** R2 - Handles user-uploaded passport/travel documents.
- **Cache:** KV - Stores session state and temporary configurations.
- **Deployment:** Wrangler v4+ (ASSET_SERVICE integration).

## 3. Directory Structure
```text

flytripvisa-app/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline for Cloudflare Workers deployment
├── migrations/
│   └── 0001_initial_schema.sql   # D1 database migration SQL files
├── public/
│   └── favicon.ico               # Static assets (if served via Worker)
├── src/
│   ├── ai/
│   │   ├── agents/               # AI Agent definitions (Visa assistant, Flight search parser)
│   │   └── index.js              # Cloudflare Workers AI integration wrapper
│   ├── config/
│   │   └── constants.js          # Global constants and HTTP status codes
│   ├── controllers/
│   │   ├── visaController.js     # Visa processing business logic
│   │   ├── flightController.js   # Flight search & booking logic
│   │   ├── storageController.js  # R2 asset upload/download handlers
│   │   └── userController.js    # User authentication & profile management
│   ├── db/
│   │   ├── queries.js            # Prepared D1 SQL queries
│   │   └── schema.js             # Table schema helper functions
│   ├── middlewares/
│   │   ├── auth.js               # JWT/Session authentication middleware
│   │   ├── cache.js              # KV caching layer middleware
│   │   └── errorHandler.js      # Global error handler
│   ├── routes/
│   │   ├── ai.routes.js          # AI Assistant endpoints
│   │   ├── flight.routes.js      # Flight API routes
│   │   ├── storage.routes.js     # R2 Document bucket routes
│   │   └── visa.routes.js        # Visa application routes
│   ├── utils/
│   │   ├── kvHelper.js           # Cache read/write utilities
│   │   ├── r2Helper.js           # R2 storage upload/delete utilities
│   │   └── response.js           # Standardized JSON response wrapper
│   └── index.js                  # Hono Main Entry Point
├── .gitignore
├── package.json
├── README.md
└── wrangler.toml                 # Cloudflare Workers Configuration

4. System Architecture Logic
​The application follows a "Modular Edge-Request" model:
​A. Routing Logic
​Static Assets: Handled by assets binding (defined in wrangler.toml). No manual fs reading required.
​API Routes:
​POST /api/chat: Interacts with AI models to assist users.
​POST /api/visa/submit: Inserts user request into D1.
​GET /api/admin/requests: Retrieves data from D1 for dashboard.html.
​B. Binding Access (Crucial for AI/Code Generation)
​When writing logic in index.js, always access resources via the env object:
​D1: const db = env.flytripvisa_db;
​R2: const bucket = env.flytripvisa_storage;
​KV: await env.FLYTRIPVISA_KV.get(key);
​Env Vars: env.APP_URL or env.APP_DOMAIN.
​5. Deployment Instructions
​For any AI agent or developer deploying this project, use:
​npx wrangler deploy (This handles code + public assets).
​For database updates: npx wrangler d1 migrations apply flytripvisa-db.
​6. Development Workflow for AI Assistants
​If you are an AI assistant helping to maintain this code:
​Constraint 1: Do not change binding names. They are mapped to Production Cloudflare IDs.
​Constraint 2: Maintain the index.js as an ES Module (export default { fetch: ... }).
​Constraint 3: When adding new features, use the D1 binding for state persistence and R2 for file handling.
​