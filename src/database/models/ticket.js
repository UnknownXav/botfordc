import db from "../db.js"

export const ticketModel = {
  /**
   * Create a new ticket for a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} userId - The user ID who created the ticket
   * @param {string} userTag - The user's tag
   * @param {string} type - The ticket type (e.g., 'order', 'support')
   * @param {string} description - Ticket description
   * @param {string} channelId - The ticket channel ID
   * @returns {number} The ticket number
   */
  create(guildId, userId, userTag, type, description, channelId) {
    // Use guild-scoped counter key
    const counterStmt = db.prepare("SELECT value FROM config WHERE guild_id = ? AND key = 'ticket_counter'")
    const counterResult = counterStmt.get(guildId)
    const counter = counterResult ? Number.parseInt(counterResult.value) : 0
    const newCounter = counter + 1

    const updateCounter = db.prepare("UPDATE config SET value = ? WHERE guild_id = ? AND key = 'ticket_counter'")
    updateCounter.run(newCounter.toString(), guildId)

    const stmt = db.prepare(`
      INSERT INTO tickets (guild_id, ticket_number, user_id, user_tag, type, description, channel_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(guildId, newCounter, userId, userTag, type, description, channelId, Date.now())
    return newCounter
  },

  /**
   * Get an open ticket by channel ID for a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} channelId - The channel ID
   * @returns {object|undefined} The ticket object or undefined
   */
  getByChannelId(guildId, channelId) {
    const stmt = db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND channel_id = ? AND status = ?")
    return stmt.get(guildId, channelId, "open")
  },

  /**
   * Get any ticket by channel ID for a guild (regardless of status)
   * @param {string} guildId - The Discord guild ID
   * @param {string} channelId - The channel ID
   * @returns {object|undefined} The ticket object or undefined
   */
  getByChannelIdAny(guildId, channelId) {
    const stmt = db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND channel_id = ?")
    return stmt.get(guildId, channelId)
  },

  /**
   * Close a ticket for a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} channelId - The channel ID
   * @returns {number} Number of rows affected
   */
  close(guildId, channelId) {
    const stmt = db.prepare(`
      UPDATE tickets SET status = 'closed', closed_at = ? 
      WHERE guild_id = ? AND channel_id = ? AND status = 'open'
    `)
    return stmt.run(Date.now(), guildId, channelId).changes
  },

  /**
   * Get all tickets for a user in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} userId - The user ID
   * @returns {array} Array of ticket objects
   */
  getByUserId(guildId, userId) {
    const stmt = db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC")
    return stmt.all(guildId, userId)
  },

  /**
   * Set ticket status for a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} channelId - The channel ID
   * @param {string} status - The new status
   */
  setStatus(guildId, channelId, status) {
    const stmt = db.prepare("UPDATE tickets SET status = ? WHERE guild_id = ? AND channel_id = ?")
    return stmt.run(status, guildId, channelId)
  },
}
