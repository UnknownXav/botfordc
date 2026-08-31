import config from "../config.js"

export const createTables = (db) => {
  // 1. Run migrations for existing tables if needed
  migrateTables(db)

  // 2. Fresh table creations (with guild_id)
  // Tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      ticket_number INTEGER NOT NULL,
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
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      verified_at INTEGER NOT NULL,
      verification_method TEXT DEFAULT 'captcha',
      PRIMARY KEY (guild_id, user_id)
    )
  `)

  // Vouches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vouches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
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
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      moderator_tag TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL
    )
  `)

  // Config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      guild_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (guild_id, key)
    )
  `)

  // Order states table for tracking conversational ticket flow
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_states (
      guild_id TEXT NOT NULL,
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
      guild_id TEXT NOT NULL,
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

  // Payment methods table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      method_name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      account_number TEXT,
      account_name TEXT,
      qr_code_url TEXT,
      instructions TEXT,
      enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(guild_id, method_name)
    )
  `)

  const defaultGuildId = config.guildId || "global"
  db.prepare(`
    INSERT OR IGNORE INTO config (guild_id, key, value) VALUES (?, 'ticket_counter', '0')
  `).run(defaultGuildId)

  console.log("Database tables created successfully")
}

function migrateTables(db) {
  const fallbackGuildId = config.guildId || "unknown"

  const checkColumn = (table, column) => {
    try {
      const columns = db.pragma(`table_info(${table})`)
      return columns.some((col) => col.name === column)
    } catch {
      return true
    }
  }

  const tableExists = (table) => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)
    return !!result
  }

  // Migrate simple tables: tickets, vouches, warnings, order_states, orders
  const simpleTables = ["tickets", "vouches", "warnings", "order_states", "orders"]
  for (const table of simpleTables) {
    if (tableExists(table) && !checkColumn(table, "guild_id")) {
      console.log(`Migrating table ${table}: adding guild_id column...`)
      db.exec(`ALTER TABLE ${table} ADD COLUMN guild_id TEXT`)
      db.prepare(`UPDATE ${table} SET guild_id = ? WHERE guild_id IS NULL`).run(fallbackGuildId)
    }
  }

  // Migrate config table
  if (tableExists("config") && !checkColumn("config", "guild_id")) {
    console.log("Migrating table config: adding guild_id and composite primary key...")
    db.exec("ALTER TABLE config RENAME TO _old_config")
    db.exec(`
      CREATE TABLE config (
        guild_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (guild_id, key)
      )
    `)
    db.prepare(`
      INSERT OR IGNORE INTO config (guild_id, key, value)
      SELECT ?, key, value FROM _old_config
    `).run(config.guildId || "global")
    db.exec("DROP TABLE _old_config")
  }

  // Migrate verified_users table
  if (tableExists("verified_users") && !checkColumn("verified_users", "guild_id")) {
    console.log("Migrating table verified_users: adding guild_id and composite primary key...")
    db.exec("ALTER TABLE verified_users RENAME TO _old_verified_users")
    db.exec(`
      CREATE TABLE verified_users (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_tag TEXT NOT NULL,
        verified_at INTEGER NOT NULL,
        verification_method TEXT DEFAULT 'captcha',
        PRIMARY KEY (guild_id, user_id)
      )
    `)
    db.prepare(`
      INSERT OR IGNORE INTO verified_users (guild_id, user_id, user_tag, verified_at, verification_method)
      SELECT ?, user_id, user_tag, verified_at, verification_method FROM _old_verified_users
    `).run(fallbackGuildId)
    db.exec("DROP TABLE _old_verified_users")
  }

  // Migrate payment_methods table
  if (tableExists("payment_methods") && !checkColumn("payment_methods", "guild_id")) {
    console.log("Migrating table payment_methods: adding guild_id and composite unique constraint...")
    db.exec("ALTER TABLE payment_methods RENAME TO _old_payment_methods")
    db.exec(`
      CREATE TABLE payment_methods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        method_name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        account_number TEXT,
        account_name TEXT,
        qr_code_url TEXT,
        instructions TEXT,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(guild_id, method_name)
      )
    `)
    db.prepare(`
      INSERT OR IGNORE INTO payment_methods (id, guild_id, method_name, display_name, account_number, account_name, qr_code_url, instructions, enabled, created_at, updated_at)
      SELECT id, ?, method_name, display_name, account_number, account_name, qr_code_url, instructions, enabled, created_at, updated_at FROM _old_payment_methods
    `).run(fallbackGuildId)
    db.exec("DROP TABLE _old_payment_methods")
  }
}
