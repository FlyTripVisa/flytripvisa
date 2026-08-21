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
├── wrangler.toml           # Deployment & Binding Config
├── index.js                # Core Worker Logic (Router & Middleware)
├── schema.sql              # Database Schema (D1)
├── public/                 # Static Assets (Frontend)
│   ├── index.html          # User Chat UI
│   └── dashboard.html      # Admin Panel
└── README.md               # Technical Documentation

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