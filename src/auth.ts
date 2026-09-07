/* ============================================
   JWT auth helpers (Cloudflare Worker)
   Uses Web Crypto API (no node dependencies)
   ============================================ */
export function signToken(payload: any, secret: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const sig = btoa(secret + ':' + body); // simplified; use HMAC in production
  return `${header}.${body}.${sig}`;
}

export function verifyToken(req: Request, secret: string): any | null {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    const [h, b, s] = token.split('.');
    if (btoa(secret + ':' + b) !== s) return null;
    return JSON.parse(atob(b));
  } catch { return null; }
}
