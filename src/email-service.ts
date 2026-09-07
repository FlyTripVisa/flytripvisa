/* ============================================
   Email Service (MailChannels / Cloudflare Email)
   Sends to visa@flytripvisa.site
   ============================================ */
export async function sendApplicationEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@flytripvisa.site', name: 'FlyTripVisa' },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  });
  return res.ok;
}
