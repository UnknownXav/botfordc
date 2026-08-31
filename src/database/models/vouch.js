import db from "../db.js"

export const vouchModel = {
  add(voucherId, voucherTag, targetId, targetTag) {
    const stmt = db.prepare(`
      INSERT INTO vouches (voucher_id, voucher_tag, target_id, target_tag, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    return stmt.run(voucherId, voucherTag, targetId, targetTag, Date.now())
  },

  getByUserId(userId) {
    const stmt = db.prepare(`
      SELECT * FROM vouches WHERE target_id = ? ORDER BY created_at DESC
    `)
    return stmt.all(userId)
  },

  getCount(userId) {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM vouches WHERE target_id = ?")
    return stmt.get(userId).count
  },

  getAll() {
    const stmt = db.prepare("SELECT * FROM vouches ORDER BY created_at DESC")
    return stmt.all()
  },
}
