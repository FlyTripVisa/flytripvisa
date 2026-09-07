/* ============================================
   Notifications: Telegram + Email
   ============================================ */
export async function sendTelegram(env: any, text: string): Promise<void> {
  const { TG_BOT_TOKEN, TG_CHAT_ID } = env;
  if (!TG_BOT_TOKEN || TG_BOT_TOKEN === 'YOUR_BOT_TOKEN') {
    console.log('[Telegram not configured]', text);
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' })
    });
  } catch (e) { console.error('Telegram error', e); }
}

export async function sendEmail(env: any, subject: string, data: any): Promise<void> {
  const { SMTP_TO } = env;
  if (!SMTP_TO) { console.log('[Email not configured]', subject, data); return; }

  // ---- Option A: Cloudflare Email Workers (recommended) ----
  // Send via the mailchannels / Email Routing binding if available.
  // ---- Option B: SMTP via a lightweight service ----
  // For now we post a structured notification to a send-mail Worker route.
  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: SMTP_TO }] }],
        from: { email: 'noreply@flytripvisa.site', name: 'FlyTripVisa' },
        subject,
        content: [{
          type: 'text/html',
          value: `<h2>${subject}</h2><pre>${JSON.stringify(data, null, 2)}</pre>`
        }]
      })
    });
  } catch (e) { console.error('Email error', e); }
}
