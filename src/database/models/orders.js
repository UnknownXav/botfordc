import db from "../db.js"

export const ordersModel = {
  /**
   * Create an order in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {object} orderData - Order data (buyer_id, buyer_tag, amount, item, mop, price, channel_id, message_id, ticket_channel_id)
   * @returns {number} The order ID
   */
  create(guildId, { buyer_id, buyer_tag, amount, item, mop, price, channel_id, message_id, ticket_channel_id }) {
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO orders (guild_id, buyer_id, buyer_tag, amount, item, mop, price, channel_id, message_id, ticket_channel_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const info = stmt.run(guildId, buyer_id, buyer_tag, amount, item, mop, price, channel_id, message_id, ticket_channel_id, "noted", now, now)
    return info.lastInsertRowid
  },

  /**
   * Get an order by ID in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {number} id - The order ID
   * @returns {object|undefined} The order object
   */
  getById(guildId, id) {
    const stmt = db.prepare("SELECT * FROM orders WHERE guild_id = ? AND id = ?")
    return stmt.get(guildId, id)
  },

  /**
   * Get an order by channel and message ID in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} channelId - The channel ID
   * @param {string} messageId - The message ID
   * @returns {object|undefined} The order object
   */
  getByMessage(guildId, channelId, messageId) {
    const stmt = db.prepare("SELECT * FROM orders WHERE guild_id = ? AND channel_id = ? AND message_id = ?")
    return stmt.get(guildId, channelId, messageId)
  },

  /**
   * Get an order by message ID in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} messageId - The message ID
   * @returns {object|undefined} The order object
   */
  getByMessageId(guildId, messageId) {
    const stmt = db.prepare("SELECT * FROM orders WHERE guild_id = ? AND message_id = ?")
    return stmt.get(guildId, messageId)
  },

  /**
   * Get the latest order for a buyer in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} buyerId - The buyer user ID
   * @returns {object|undefined} The order object
   */
  getLatestByBuyer(guildId, buyerId) {
    const stmt = db.prepare("SELECT * FROM orders WHERE guild_id = ? AND buyer_id = ? ORDER BY created_at DESC LIMIT 1")
    return stmt.get(guildId, buyerId)
  },

  /**
   * Get all orders for a ticket channel in a guild
   * @param {string} guildId - The Discord guild ID
   * @param {string} ticketChannelId - The ticket channel ID
   * @returns {array} Array of order objects
   */
  getByTicketChannelId(guildId, ticketChannelId) {
    const stmt = db.prepare("SELECT * FROM orders WHERE guild_id = ? AND ticket_channel_id = ? ORDER BY created_at DESC")
    return stmt.all(guildId, ticketChannelId)
  },

  /**
   * Update order status
   * @param {string} guildId - The Discord guild ID
   * @param {number} id - The order ID
   * @param {string} status - The new status
   */
  updateStatus(guildId, id, status) {
    const now = Date.now()
    const stmt = db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE guild_id = ? AND id = ?")
    return stmt.run(status, now, guildId, id)
  },

  /**
   * Set message for an order
   * @param {string} guildId - The Discord guild ID
   * @param {number} id - The order ID
   * @param {string} channelId - The channel ID
   * @param {string} messageId - The message ID
   */
  setMessage(guildId, id, channelId, messageId) {
    const now = Date.now()
    const stmt = db.prepare("UPDATE orders SET channel_id = ?, message_id = ?, updated_at = ? WHERE guild_id = ? AND id = ?")
    return stmt.run(channelId, messageId, now, guildId, id)
  },

  /**
   * Clear ticket channel for an order
   * @param {string} guildId - The Discord guild ID
   * @param {number} id - The order ID
   */
  clearTicketChannel(guildId, id) {
    const now = Date.now()
    const stmt = db.prepare("UPDATE orders SET ticket_channel_id = NULL, updated_at = ? WHERE guild_id = ? AND id = ?")
    return stmt.run(now, guildId, id)
  },
}
