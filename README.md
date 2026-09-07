# FlyTripVisa

AI-powered online visa application platform.  
Frontend (HTML/CSS/JS) + Cloudflare Worker backend (D1 + AI Gateway) with **Telegram + Email notifications**.

## Folder Structure

```
flytripvisa/
├── public/             # Static assets (served by Cloudflare)
│   ├── index.html      # Home (your existing file)
│   ├── login.html      # Admin login
│   ├── dashboard.html  # Admin dashboard
│   ├── chat.html       # Fly AI chat UI
│   └── assets/         # CSS, JS
├── src/                # Cloudflare Worker (TypeScript)
│   ├── index.ts        # Main router + API
│   ├── auth.ts         # JWT helpers
│   ├── notifications.ts# Telegram + Email
│   ├── pdf-service.ts  # PDF generation
│   ├── email-service.ts# MailChannels email
│   └── types.ts
├── test/               # Tests
├── schema.sql          # D1 database schema
├── wrangler.toml       # Cloudflare config
└── tsconfig.json
```

## Setup

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create D1 database**
   ```bash
   wrangler d1 create flytripvisa_db
   # Copy the database_id into wrangler.toml
   wrangler d1 execute flytripvisa_db --file=schema.sql --remote
   ```

3. **Set secrets**
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put TG_BOT_TOKEN
   wrangler secret put TG_CHAT_ID
   wrangler secret put SMTP_TO   # visa@flytripvisa.site
   ```

4. **Telegram setup**
   - Create bot via [@BotFather](https://t.me/BotFather)
   - Get `TG_BOT_TOKEN`
   - Send `/start` to your bot, then get chat ID from `https://api.telegram.org/bot<TOKEN>/getUpdates`

5. **Email setup (visa@flytripvisa.site)**
   - In Cloudflare Dashboard → Email → Email Routing → enable
   - Catch-all address: `visa@flytripvisa.site`
   - Emails sent via MailChannels (built into Workers)

## Deploy

```bash
wrangler deploy
```

Frontend is served from `public/` (configure `assets.directory` in `wrangler.toml`).

## Notifications

- ✅ New visa application → Telegram + Email
- ✅ Status change (approve/reject) → Telegram + Email
- ✅ AI chat inquiry → Telegram

All notifications go to your Telegram chat + `visa@flytripvisa.site`.

## Default Admin

- Username: `admin`
- Password: `admin123` (change after first login!)

---
© 2026 FLYTRIPVISA | 飞行旅行签证
