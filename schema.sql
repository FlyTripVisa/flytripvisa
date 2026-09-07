-- ============================================
-- FlyTripVisa D1 Schema
-- ============================================

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  destination TEXT NOT NULL,
  visa_type TEXT DEFAULT 'tourist',
  passport_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'ai_chat',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER,
  action TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default admin (username: admin, password: admin123)
-- Replace password_hash with a real hash in production!
INSERT OR IGNORE INTO admins (username, password_hash)
VALUES ('admin', 'admin123');
