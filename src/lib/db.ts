import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'gsws.db')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS gsws_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wp_user_id INTEGER UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    credit_balance REAL NOT NULL DEFAULT 0.00,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gsws_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES gsws_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gsws_package_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES gsws_users(id) ON DELETE CASCADE,
    package_id TEXT NOT NULL,
    can_manage INTEGER NOT NULL DEFAULT 1,
    can_topup INTEGER NOT NULL DEFAULT 0,
    granted_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, package_id)
  );

  CREATE TABLE IF NOT EXISTS gsws_topup_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES gsws_users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_token ON gsws_sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON gsws_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_package_access_user ON gsws_package_access(user_id);
`)

export default db
