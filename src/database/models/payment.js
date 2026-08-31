import { getDb } from "../db.js"

export const paymentModel = {
  create(methodName, displayName, accountNumber, accountName, qrCodeUrl, instructions) {
    const db = getDb()
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO payment_methods (method_name, display_name, account_number, account_name, qr_code_url, instructions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(methodName, displayName, accountNumber, accountName, qrCodeUrl, instructions, now, now)
  },

  getByMethod(methodName) {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM payment_methods WHERE method_name = ? AND enabled = 1")
    return stmt.get(methodName)
  },

  getAll() {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM payment_methods WHERE enabled = 1 ORDER BY id ASC")
    return stmt.all()
  },

  update(methodName, data) {
    const db = getDb()
    const updates = []
    const values = []

    if (data.displayName) {
      updates.push("display_name = ?")
      values.push(data.displayName)
    }
    if (data.accountNumber !== undefined) {
      updates.push("account_number = ?")
      values.push(data.accountNumber)
    }
    if (data.accountName !== undefined) {
      updates.push("account_name = ?")
      values.push(data.accountName)
    }
    if (data.qrCodeUrl !== undefined) {
      updates.push("qr_code_url = ?")
      values.push(data.qrCodeUrl)
    }
    if (data.instructions !== undefined) {
      updates.push("instructions = ?")
      values.push(data.instructions)
    }

    updates.push("updated_at = ?")
    values.push(Date.now())
    values.push(methodName)

    const stmt = db.prepare(`UPDATE payment_methods SET ${updates.join(", ")} WHERE method_name = ?`)
    return stmt.run(...values)
  },

  delete(methodName) {
    const db = getDb()
    const stmt = db.prepare("UPDATE payment_methods SET enabled = 0 WHERE method_name = ?")
    return stmt.run(methodName)
  },
}
