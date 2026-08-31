import db from "../db.js"

export const verificationModel = {
  /**
   * Add a verified user to a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} userId - The user ID
   * @param {string} userTag - The user's tag
   * @param {string} method - Verification method (default: 'captcha')
   */
  add(guildId, userId, userTag, method = "captcha") {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO verified_users (guild_id, user_id, user_tag, verified_at, verification_method)
      VALUES (?, ?, ?, ?, ?)
    `)
    return stmt.run(guildId, userId, userTag, Date.now(), method)
  },

  /**
   * Check if a user is verified in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} userId - The user ID
   * @returns {boolean} True if verified, false otherwise
   */
  isVerified(guildId, userId) {
    const stmt = db.prepare("SELECT * FROM verified_users WHERE guild_id = ? AND user_id = ?")
    return stmt.get(guildId, userId) !== undefined
  },

  /**
   * Remove a user's verification in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} userId - The user ID
   * @returns {number} Number of rows affected
   */
  remove(guildId, userId) {
    const stmt = db.prepare("DELETE FROM verified_users WHERE guild_id = ? AND user_id = ?")
    return stmt.run(guildId, userId).changes
  },
}
