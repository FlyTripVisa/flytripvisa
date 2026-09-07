/* ============================================
   Shared TypeScript types
   ============================================ */
export interface Application {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  destination: string;
  visa_type: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
}

export interface ChatRequest { message: string; }
export interface ChatResponse { reply: string; }

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  TG_BOT_TOKEN: string;
  TG_CHAT_ID: string;
  SMTP_TO: string;
}
