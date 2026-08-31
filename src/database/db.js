import Database from "better-sqlite3"
import config from "../config.js"
import fs from "fs"
import path from "path"
import { createTables } from "./schema.js"

// Resolve absolute path (important on Windows)
const dbPath = path.resolve(config.databasePath)
const dbDir = path.dirname(dbPath)

// Create folder if missing
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma("journal_mode = WAL")

// Ensure all tables are created/updated on startup
try {
  createTables(db)
} catch (e) {
  console.error("Failed to create DB tables:", e)
}

export function getDb() {
  return db
}

export default db
