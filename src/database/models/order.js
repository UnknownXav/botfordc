import db from "../db.js"

export const orderModel = {
  // Create or update order state for a user in a ticket
  setState(ticketChannelId, userId, state, data = {}) {
    const stmt = db.prepare(`
      INSERT INTO order_states (ticket_channel_id, user_id, state, data, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(ticket_channel_id) 
      DO UPDATE SET state = ?, data = ?, updated_at = ?
    `)
    const dataJson = JSON.stringify(data)
    const now = Date.now()
    stmt.run(ticketChannelId, userId, state, dataJson, now, state, dataJson, now)
  },

  // Get order state for a ticket
  getState(ticketChannelId) {
    const stmt = db.prepare("SELECT * FROM order_states WHERE ticket_channel_id = ?")
    const result = stmt.get(ticketChannelId)
    if (result) {
      result.data = JSON.parse(result.data)
    }
    return result
  },

  // Delete order state
  deleteState(ticketChannelId) {
    const stmt = db.prepare("DELETE FROM order_states WHERE ticket_channel_id = ?")
    stmt.run(ticketChannelId)
  },
}
