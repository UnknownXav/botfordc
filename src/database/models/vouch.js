import db from "../db.js"

export const vouchModel = {
  /**
   * Add a vouch in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} voucherId - The user ID giving the vouch
   * @param {string} voucherTag - The user's tag giving the vouch
   * @param {string} targetId - The user ID receiving the vouch
   * @param {string} targetTag - The user's tag receiving the vouch
   */
  add(guildId, voucherId, voucherTag, targetId, targetTag) {
    const stmt = db.prepare(`
      INSERT INTO vouches (guild_id, voucher_id, voucher_tag, target_id, target_tag, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(guildId, voucherId, voucherTag, targetId, targetTag, Date.now())
  },

  /**
   * Get all vouches for a user in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} userId - The target user ID
   * @returns {array} Array of vouch objects
   */
  getByUserId(guildId, userId) {
    const stmt = db.prepare(`
      SELECT * FROM vouches WHERE guild_id = ? AND target_id = ? ORDER BY created_at DESC
    `)
    return stmt.all(guildId, userId)
  },

  /**
   * Get vouch count for a user in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} userId - The target user ID
   * @returns {number} The vouch count
   */
  getCount(guildId, userId) {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM vouches WHERE guild_id = ? AND target_id = ?")
    return stmt.get(guildId, userId).count
  },

  /**
   * Get all vouches in a guild
   * @param {string} guildId - The Discord guild ID
   * @returns {array} Array of vouch objects
   */
  getAll(guildId) {
    const stmt = db.prepare("SELECT * FROM vouches WHERE guild_id = ? ORDER BY created_at DESC")
    return stmt.all(guildId)
  },
}
