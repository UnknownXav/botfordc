import db from "../db.js"

export const ordersModel = {
  create({ buyer_id, buyer_tag, amount, item, mop, price, channel_id, message_id, ticket_channel_id }) {
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO orders (buyer_id, buyer_tag, amount, item, mop, price, channel_id, message_id, ticket_channel_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const info = stmt.run(buyer_id, buyer_tag, amount, item, mop, price, channel_id, message_id, ticket_channel_id, "noted", now, now)
    return info.lastInsertRowid
  },

  getById(id) {
    const stmt = db.prepare("SELECT * FROM orders WHERE id = ?")
    return stmt.get(id)
  },

  getByMessage(channelId, messageId) {
    const stmt = db.prepare("SELECT * FROM orders WHERE channel_id = ? AND message_id = ?")
    return stmt.get(channelId, messageId)
  },

  getByMessageId(messageId) {
    const stmt = db.prepare("SELECT * FROM orders WHERE message_id = ?")
    return stmt.get(messageId)
  },

  getLatestByBuyer(buyerId) {
    const stmt = db.prepare("SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC LIMIT 1")
    return stmt.get(buyerId)
  },

  getByTicketChannelId(ticketChannelId) {
    const stmt = db.prepare("SELECT * FROM orders WHERE ticket_channel_id = ? ORDER BY created_at DESC")
    return stmt.all(ticketChannelId)
  },

  updateStatus(id, status) {
    const now = Date.now()
    const stmt = db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?")
    return stmt.run(status, now, id)
  },

  setMessage(id, channelId, messageId) {
    const now = Date.now()
    const stmt = db.prepare("UPDATE orders SET channel_id = ?, message_id = ?, updated_at = ? WHERE id = ?")
    return stmt.run(channelId, messageId, now, id)
  },

  clearTicketChannel(id) {
    const now = Date.now()
    const stmt = db.prepare("UPDATE orders SET ticket_channel_id = NULL, updated_at = ? WHERE id = ?")
    return stmt.run(now, id)
  },
}
