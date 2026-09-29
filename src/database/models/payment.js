import { getDb } from "../db.js"

export const paymentModel = {
  /**
   * Create a payment method in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} methodName - The payment method name
   * @param {string} displayName - The display name
   * @param {string} accountNumber - Account number
   * @param {string} accountName - Account name
   * @param {string} qrCodeUrl - QR code URL
   * @param {string} instructions - Payment instructions
   * @param {string|null} qrPayload - Static QR Ph payload
   */
  create(guildId, methodName, displayName, accountNumber, accountName, qrCodeUrl, instructions, qrPayload = null) {
    const db = getDb()
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO payment_methods (guild_id, method_name, display_name, account_number, account_name, qr_code_url, qr_payload, instructions, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(guild_id, method_name)
      DO UPDATE SET
        display_name = excluded.display_name,
        account_number = excluded.account_number,
        account_name = excluded.account_name,
        qr_code_url = excluded.qr_code_url,
        qr_payload = excluded.qr_payload,
        instructions = excluded.instructions,
        enabled = 1,
        updated_at = excluded.updated_at
    `)
    return stmt.run(guildId, methodName, displayName, accountNumber, accountName, qrCodeUrl, qrPayload, instructions, now, now)
  },

  /**
   * Get a payment method by name in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} methodName - The payment method name
   * @returns {object|undefined} The payment method object
   */
  getByMethod(guildId, methodName) {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM payment_methods WHERE guild_id = ? AND method_name = ? AND enabled = 1")
    return stmt.get(guildId, methodName)
  },

  /**
   * Get all enabled payment methods for a guild
   * @param {string} guildId - The Discord guild ID
   * @returns {array} Array of payment method objects
   */
  getAll(guildId) {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM payment_methods WHERE guild_id = ? AND enabled = 1 ORDER BY id ASC")
    return stmt.all(guildId)
  },

  /**
   * Update a payment method in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} methodName - The payment method name
   * @param {object} data - Update data (displayName, accountNumber, etc.)
   */
  update(guildId, methodName, data) {
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
    if (data.qrPayload !== undefined) {
      updates.push("qr_payload = ?")
      values.push(data.qrPayload)
    }
    if (data.instructions !== undefined) {
      updates.push("instructions = ?")
      values.push(data.instructions)
    }

    updates.push("updated_at = ?")
    values.push(Date.now())
    values.push(guildId)
    values.push(methodName)

    const stmt = db.prepare(`UPDATE payment_methods SET ${updates.join(", ")} WHERE guild_id = ? AND method_name = ?`)
    return stmt.run(...values)
  },

  /**
   * Delete/disable a payment method in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} methodName - The payment method name
   */
  delete(guildId, methodName) {
    const db = getDb()
    const stmt = db.prepare("UPDATE payment_methods SET enabled = 0 WHERE guild_id = ? AND method_name = ?")
    return stmt.run(guildId, methodName)
  },
}
