/* ============================================
   FlyTripVisa - Cloudflare Worker Entry
   D1 + JWT Auth + Telegram + Email + AI Chat
   ============================================ */
import { verifyToken, signToken } from './auth';
import { sendTelegram, sendEmail } from './notifications';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  TG_BOT_TOKEN: string;
  TG_CHAT_ID: string;
  SMTP_TO: string; // visa@flytripvisa.site
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' }
  });
}
async function getBody(req: Request) { try { return await req.json(); } catch { return {}; } }

// Simple hash placeholder — replace with bcrypt/argon2 in production
function hash(s: string) { return s; }

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const { pathname } = url;

    /* ===== Public: Admin Login ===== */
    if (pathname === '/api/admin/login' && req.method === 'POST') {
      const { username, password } = await getBody(req);
      const row = await env.DB.prepare(
        'SELECT * FROM admins WHERE username = ? AND password_hash = ?'
      ).bind(username, hash(password)).first();
      if (!row) return json({ error: 'Invalid credentials' }, 401);
      const token = signToken({ id: row.id, username }, env.JWT_SECRET);
      return json({ ok: true, token });
    }

    /* ===== Public: Submit Visa Application (→ notify) ===== */
    if (pathname === '/api/applications' && req.method === 'POST') {
      const a: any = await getBody(req);
      const { meta } = await env.DB.prepare(
        'INSERT INTO applications (full_name, email, phone, destination, visa_type) VALUES (?,?,?,?,?)'
      ).bind(a.full_name, a.email, a.phone, a.destination, a.visa_type || 'tourist').run();
      const id = meta.last_row_id;

      const msg = `🛂 *New Visa Application*\n👤 ${a.full_name}\n📧 ${a.email}\n📱 ${a.phone}\n🌍 ${a.destination}\n#${id}`;
      await sendTelegram(env, msg);
      await sendEmail(env, 'New Visa Application #' + id, a);

      return json({ ok: true, id });
    }

    /* ===== Auth gate for admin routes ===== */
    const auth = verifyToken(req, env.JWT_SECRET);
    if (pathname.startsWith('/api/admin') && !auth) {
      return json({ error: 'Unauthorized' }, 401);
    }

    /* ===== Dashboard Stats ===== */
    if (pathname === '/api/admin/stats') {
      const t = await env.DB.prepare('SELECT COUNT(*) c FROM applications').first();
      const p = await env.DB.prepare("SELECT COUNT(*) c FROM applications WHERE status='pending'").first();
      const ap = await env.DB.prepare("SELECT COUNT(*) c FROM applications WHERE status='approved'").first();
      const r = await env.DB.prepare("SELECT COUNT(*) c FROM applications WHERE status='rejected'").first();
      return json({ total: t?.c, pending: p?.c, approved: ap?.c, rejected: r?.c });
    }

    /* ===== List Applications ===== */
    if (pathname === '/api/admin/applications') {
      const rows = await env.DB.prepare('SELECT * FROM applications ORDER BY created_at DESC').all();
      return json(rows.results);
    }

    /* ===== Update Status (approve/reject → notify) ===== */
    if (req.method === 'PATCH' && pathname.startsWith('/api/admin/applications/')) {
      const id = pathname.split('/').pop();
      const { status } = await getBody(req);
      await env.DB.prepare('UPDATE applications SET status = ? WHERE id = ?').bind(status, id).run();
      const app: any = await env.DB.prepare('SELECT * FROM applications WHERE id = ?').bind(id).first();
      if (app) {
        const msg = `✅ Application #${id} *${status}*\n👤 ${app.full_name}\n📧 ${app.email}`;
        await sendTelegram(env, msg);
        await sendEmail(env, `Application #${id} ${status}`, { id, status, ...app });
      }
      return json({ ok: true });
    }

    /* ===== AI Chat (Fly AI) ===== */
    if (pathname === '/api/chat' && req.method === 'POST') {
      const { message } = await getBody(req);
      await sendTelegram(env, `💬 [AI Inquiry]\n"${message}"`);
      // → Here call Workers AI / AI Gateway for real reply
      const reply = `Demo reply: you asked "${message}". Configure Workers AI for real answers.`;
      return json({ reply });
    }

    return json({ error: 'Not found' }, 404);
  }
};
