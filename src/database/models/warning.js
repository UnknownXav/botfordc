import db from "../db.js"

export const warningModel = {
  add(userId, userTag, moderatorId, moderatorTag, reason) {
    const stmt = db.prepare(`
      INSERT INTO warnings (user_id, user_tag, moderator_id, moderator_tag, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(userId, userTag, moderatorId, moderatorTag, reason, Date.now())
  },

  getByUserId(userId) {
    const stmt = db.prepare("SELECT * FROM warnings WHERE user_id = ? ORDER BY created_at DESC")
    return stmt.all(userId)
  },

  getCount(userId) {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM warnings WHERE user_id = ?")
    return stmt.get(userId).count
  },
}
