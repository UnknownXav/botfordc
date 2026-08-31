import db from "../db.js"

export const verificationModel = {
  add(userId, userTag, method = "captcha") {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO verified_users (user_id, user_tag, verified_at, verification_method)
      VALUES (?, ?, ?, ?)
    `)
    return stmt.run(userId, userTag, Date.now(), method)
  },

  isVerified(userId) {
    const stmt = db.prepare("SELECT * FROM verified_users WHERE user_id = ?")
    return stmt.get(userId) !== undefined
  },

  remove(userId) {
    const stmt = db.prepare("DELETE FROM verified_users WHERE user_id = ?")
    return stmt.run(userId).changes
  },
}
