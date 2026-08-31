export const createTables = (db) => {
  // Queue table removed

  // Tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number INTEGER UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      channel_id TEXT UNIQUE,
      status TEXT DEFAULT 'open',
      created_at INTEGER NOT NULL,
      closed_at INTEGER
    )
  `)

  // Verified users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS verified_users (
      user_id TEXT PRIMARY KEY,
      user_tag TEXT NOT NULL,
      verified_at INTEGER NOT NULL,
      verification_method TEXT DEFAULT 'captcha'
    )
  `)

  // Vouches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vouches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id TEXT NOT NULL,
      voucher_tag TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_tag TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)

  // Warnings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      moderator_tag TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL
    )
  `)

  // Config table for sticky messages and welcome config
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // Order states table for tracking conversational ticket flow
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_states (
      ticket_channel_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      state TEXT NOT NULL,
      data TEXT DEFAULT '{}',
      updated_at INTEGER NOT NULL
    )
  `)

  // Persistent orders table for queue entries
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id TEXT NOT NULL,
      buyer_tag TEXT NOT NULL,
      amount TEXT,
      item TEXT,
      mop TEXT,
      price TEXT,
      channel_id TEXT,
      message_id TEXT,
      ticket_channel_id TEXT,
      status TEXT DEFAULT 'noted',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // Ticket counter
  db.exec(`
    INSERT OR IGNORE INTO config (key, value) VALUES ('ticket_counter', '0')
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method_name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      account_number TEXT,
      account_name TEXT,
      qr_code_url TEXT,
      instructions TEXT,
      enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  console.log("Database tables created successfully")
}
