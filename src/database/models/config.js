import db from "../db.js"

export const configModel = {
  get(key) {
    const stmt = db.prepare("SELECT value FROM config WHERE key = ?")
    const result = stmt.get(key)
    return result?.value
  },

  set(key, value) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)
    `)
    return stmt.run(key, value)
  },

  delete(key) {
    const stmt = db.prepare("DELETE FROM config WHERE key = ?")
    return stmt.run(key).changes
  },
}
