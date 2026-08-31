import db from "../db.js"

export const orderModel = {
  /**
   * Create or update order state for a user in a ticket in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} ticketChannelId - The ticket channel ID
   * @param {string} userId - The user ID
   * @param {string} state - The order state
   * @param {object} data - Order state data (default: {})
   */
  setState(guildId, ticketChannelId, userId, state, data = {}) {
    const stmt = db.prepare(`
      INSERT INTO order_states (guild_id, ticket_channel_id, user_id, state, data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(ticket_channel_id) 
      DO UPDATE SET guild_id = ?, user_id = ?, state = ?, data = ?, updated_at = ?
    `)
    const dataJson = JSON.stringify(data)
    const now = Date.now()
    stmt.run(guildId, ticketChannelId, userId, state, dataJson, now, guildId, userId, state, dataJson, now)
  },

  /**
   * Get order state for a ticket in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} ticketChannelId - The ticket channel ID
   * @returns {object|undefined} The order state object or undefined
   */
  getState(guildId, ticketChannelId) {
    const stmt = db.prepare("SELECT * FROM order_states WHERE guild_id = ? AND ticket_channel_id = ?")
    const result = stmt.get(guildId, ticketChannelId)
    if (result) {
      result.data = JSON.parse(result.data)
    }
    return result
  },

  /**
   * Delete order state for a ticket in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} ticketChannelId - The ticket channel ID
   */
  deleteState(guildId, ticketChannelId) {
    const stmt = db.prepare("DELETE FROM order_states WHERE guild_id = ? AND ticket_channel_id = ?")
    stmt.run(guildId, ticketChannelId)
  },
}
