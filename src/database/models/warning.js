import db from "../db.js"

export const warningModel = {
  /**
   * Add a warning for a user in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} userId - The user ID
   * @param {string} userTag - The user's tag
   * @param {string} moderatorId - The moderator user ID
   * @param {string} moderatorTag - The moderator's tag
   * @param {string} reason - Warning reason
   */
  add(guildId, userId, userTag, moderatorId, moderatorTag, reason) {
    const stmt = db.prepare(`
      INSERT INTO warnings (guild_id, user_id, user_tag, moderator_id, moderator_tag, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(guildId, userId, userTag, moderatorId, moderatorTag, reason, Date.now())
  },

  /**
   * Get all warnings for a user in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} userId - The user ID
   * @returns {array} Array of warning objects
   */
  getByUserId(guildId, userId) {
    const stmt = db.prepare("SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC")
    return stmt.all(guildId, userId)
  },

  /**
   * Get warning count for a user in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} userId - The user ID
   * @returns {number} The warning count
   */
  getCount(guildId, userId) {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?")
    return stmt.get(guildId, userId).count
  },
}
