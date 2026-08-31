import db from "../db.js"

export const ticketModel = {
  create(userId, userTag, type, description, channelId) {
    const counterStmt = db.prepare("SELECT value FROM config WHERE key = 'ticket_counter'")
    const counter = Number.parseInt(counterStmt.get().value)
    const newCounter = counter + 1

    const updateCounter = db.prepare("UPDATE config SET value = ? WHERE key = 'ticket_counter'")
    updateCounter.run(newCounter.toString())

    const stmt = db.prepare(`
      INSERT INTO tickets (ticket_number, user_id, user_tag, type, description, channel_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(newCounter, userId, userTag, type, description, channelId, Date.now())
    return newCounter
  },

  getByChannelId(channelId) {
    const stmt = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = ?")
    return stmt.get(channelId, "open")
  },

  // Return ticket regardless of status
  getByChannelIdAny(channelId) {
    const stmt = db.prepare("SELECT * FROM tickets WHERE channel_id = ?")
    return stmt.get(channelId)
  },

  close(channelId) {
    const stmt = db.prepare(`
      UPDATE tickets SET status = 'closed', closed_at = ? 
      WHERE channel_id = ? AND status = 'open'
    `)
    return stmt.run(Date.now(), channelId).changes
  },

  getByUserId(userId) {
    const stmt = db.prepare("SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC")
    return stmt.all(userId)
  },

  setStatus(channelId, status) {
    const stmt = db.prepare("UPDATE tickets SET status = ? WHERE channel_id = ?")
    return stmt.run(status, channelId)
  },
}
