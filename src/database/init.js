import Database from "better-sqlite3"
import { createTables } from "./schema.js"
import config from "../config.js"
import { mkdirSync } from "fs"
import { dirname } from "path"

export async function initDb() {
  // Ensure data directory exists
  try {
    mkdirSync(dirname(config.databasePath), { recursive: true })
  } catch (err) {
    if (err.code !== "EEXIST") throw err
  }

  const db = new Database(config.databasePath)
  db.pragma("journal_mode = WAL")

  createTables(db)

  console.log("Database initialized at:", config.databasePath)
  return db
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await initDb()
  process.exit(0)
}
