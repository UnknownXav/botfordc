import db from "../db.js"

export const configModel = {
  /**
   * Get a config value for a specific guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} key - The config key
   * @returns {string|undefined} The config value, or undefined if not found
   */
  get(guildId, key) {
    const stmt = db.prepare("SELECT value FROM config WHERE guild_id = ? AND key = ?")
    const result = stmt.get(guildId, key)
    return result?.value
  },

  /**
   * Set a config value for a specific guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} key - The config key
   * @param {string} value - The config value
   */
  set(guildId, key, value) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO config (guild_id, key, value) VALUES (?, ?, ?)
    `)
    return stmt.run(guildId, key, value)
  },

  /**
   * Delete a config value for a specific guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} key - The config key
   */
  delete(guildId, key) {
    const stmt = db.prepare("DELETE FROM config WHERE guild_id = ? AND key = ?")
    return stmt.run(guildId, key).changes
  },
}
