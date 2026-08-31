// queueModel removed — stub to avoid runtime errors where still imported
export const queueModel = {
  add() {
    throw new Error("queueModel is disabled")
  },
  remove() {
    throw new Error("queueModel is disabled")
  },
  getAll() {
    return []
  },
  getPosition() {
    return null
  },
  updatePositions() {},
  complete() {},
}
