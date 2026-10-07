# FlyTripVisa MCP Chat UI

A GitHub-ready, Cloudflare Workers + static frontend chat application for connecting a browser chat UI to a server-side Muse AI endpoint, with optional MCP proxy support.

## Features

- Modern responsive ChatGPT-style interface
- Cloudflare Workers backend
- Static assets served by Workers Assets
- Server-side Muse API key; never exposed to the browser
- OpenAI-compatible Muse endpoint support
- Streaming responses (SSE, JSON streaming, and plain text fallback)
- Conversation history in localStorage
- New chat / stop generation
- Markdown rendering with safe HTML escaping
- Copy buttons for assistant code blocks
- Configurable Muse endpoint/model through Cloudflare variables/secrets
- Optional `/api/mcp` pass-through for an MCP HTTP endpoint
- Health endpoint: `/api/health`

## 1. GitHub

Create a repository and push this project:

```bash
git init
git add .
git commit -m "Initial FlyTripVisa MCP Chat UI"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPO.git
git push -u origin main
```

## 2. Cloudflare

Install Wrangler:

```bash
npm install
```

Login:

```bash
npx wrangler login
```

Set the production secret:

```bash
npx wrangler secret put MUSE_API_KEY
```

Then deploy:

```bash
npm run deploy
```

## 3. Configure Muse

Edit `wrangler.jsonc` for non-secret variables:

- `MUSE_API_URL`
- `MUSE_MODEL`
- `MUSE_API_STYLE`
- `ALLOWED_ORIGIN`

Set the API key as a secret:

```bash
npx wrangler secret put MUSE_API_KEY
```

For a Muse endpoint that is OpenAI-compatible:

```text
MUSE_API_STYLE=openai
```

The Worker sends:

```json
{
  "model": "YOUR_MUSE_MODEL",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": true
}
```

If your Muse API uses a different request/response format, edit only the `buildMuseRequest()` and `extractText()` functions in `worker/index.ts`.

## 4. Local development

```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars
npm run dev
```

## 5. API routes

### POST `/api/chat`

Request:

```json
{
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": true
}
```

Response:

- `text/event-stream` when Muse streams
- JSON/text fallback when it does not

### GET `/api/health`

Returns service status and whether Muse is configured.

### POST `/api/mcp`

Optional MCP HTTP proxy. Disabled by default. Set:

```text
MCP_ENABLED=true
MCP_SERVER_URL=https://your-mcp-server.example.com
```

and, if needed:

```bash
npx wrangler secret put MCP_AUTH_TOKEN
```

## Cloudflare Dashboard setup

Workers & Pages → your Worker → Settings → Variables and Secrets.

Variables:
- `MUSE_API_URL`
- `MUSE_MODEL`
- `MUSE_API_STYLE`
- `ALLOWED_ORIGIN`
- `MCP_ENABLED`
- `MCP_SERVER_URL`

Secret:
- `MUSE_API_KEY`
- optional `MCP_AUTH_TOKEN`

Do not put API keys in `public/`.

## Custom domain

Attach your domain in Cloudflare:

Workers & Pages → your Worker → Settings → Domains & Routes → Add Custom Domain.

For example:

```text
chat.flytripvisa.site
```

If you want the chat directly at the main domain, use a route such as:

```text
flytripvisa.site/chat*
```

## Important

This project does not assume a specific proprietary Muse API schema beyond OpenAI-compatible chat completion semantics. If your exact Muse endpoint has a different payload, send its endpoint documentation/example request and the adapter can be changed without rebuilding the UI.
