import QRCode from "qrcode"

/**
 * Parse a TLV (Tag-Length-Value) string into an array of objects.
 * Each item has { tag, val }.
 * @param {string} str
 * @returns {Array<{ tag: string, val: string }>}
 */
export function parseTLV(str) {
  if (typeof str !== "string") {
    throw new TypeError("Payload must be a string")
  }
  const items = []
  let i = 0
  while (i < str.length) {
    if (i + 4 > str.length) {
      throw new Error(`Malformed TLV string at index ${i}: not enough characters for tag and length`)
    }
    const tag = str.substring(i, i + 2)
    const len = Number.parseInt(str.substring(i + 2, i + 4), 10)
    if (Number.isNaN(len) || len < 0) {
      throw new Error(`Malformed TLV length for tag ${tag} at index ${i}`)
    }
    if (i + 4 + len > str.length) {
      throw new Error(`Malformed TLV string for tag ${tag}: length ${len} exceeds payload bounds`)
    }
    const val = str.substring(i + 4, i + 4 + len)
    items.push({ tag, val })
    i += 4 + len
  }
  return items
}

/**
 * Build a TLV string from an array of { tag, val } objects.
 * Tag is 2 characters, length is padded to 2 digits.
 * @param {Array<{ tag: string, val: string }>} items
 * @returns {string}
 */
export function buildTLV(items) {
  let result = ""
  for (const item of items) {
    const lenStr = String(item.val.length).padStart(2, "0")
    result += `${item.tag}${lenStr}${item.val}`
  }
  return result
}

/**
 * Calculate CRC-16/CCITT-FALSE checksum (poly 0x1021, init 0xFFFF).
 * Returns 4-character uppercase hexadecimal string.
 * @param {string} str
 * @returns {string}
 */
export function crc16(str) {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8)
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF
      } else {
        crc = (crc << 1) & 0xFFFF
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

/**
 * Validate whether a payload is a valid QR Ph / EMVCo payload.
 * Must start with "000201", end with tag 63 length 04, and matching CRC.
 * @param {string} payload
 * @returns {boolean}
 */
export function isValidQrPayload(payload) {
  if (typeof payload !== "string") return false
  if (!payload.startsWith("000201")) return false
  if (payload.length < 10) return false

  // Must end with "6304" + 4 hex characters
  if (payload.slice(-8, -4) !== "6304") return false

  const expectedCrc = payload.slice(-4).toUpperCase()
  const dataToCrc = payload.slice(0, -4)
  if (crc16(dataToCrc) !== expectedCrc) return false

  try {
    const items = parseTLV(payload)
    const lastItem = items[items.length - 1]
    if (!lastItem || lastItem.tag !== "63" || lastItem.val.length !== 4) {
      return false
    }
  } catch {
    return false
  }

  return true
}

/**
 * Generate dynamic amount QR Ph payload string.
 * Sets tag 01 to "12", inserts tag 54 with amount before first tag > 54, recalculates CRC.
 * @param {string} payload
 * @param {number|string} amount
 * @returns {string}
 */
export function buildAmountQrString(payload, amount) {
  if (!isValidQrPayload(payload)) {
    throw new Error("Invalid QR Ph payload")
  }
  const numericAmount = Number(amount)
  if (typeof amount === "boolean" || Number.isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Amount must be a number greater than 0")
  }

  const items = parseTLV(payload)
  // Remove tags 54 (Transaction Amount) and 63 (CRC)
  const filtered = items.filter((it) => it.tag !== "54" && it.tag !== "63")

  // Set tag 01 to "12" (Dynamic QR)
  const tag01 = filtered.find((it) => it.tag === "01")
  if (tag01) {
    tag01.val = "12"
  } else {
    filtered.unshift({ tag: "01", val: "12" })
  }

  // Insert tag 54 with Number(amount).toFixed(2) BEFORE the first tag numerically greater than 54
  const formattedAmount = numericAmount.toFixed(2)
  const tag54Item = { tag: "54", val: formattedAmount }
  const insertIndex = filtered.findIndex((it) => Number.parseInt(it.tag, 10) > 54)
  if (insertIndex !== -1) {
    filtered.splice(insertIndex, 0, tag54Item)
  } else {
    filtered.push(tag54Item)
  }

  const tlvString = buildTLV(filtered)
  const toChecksum = tlvString + "6304"
  const checksum = crc16(toChecksum)

  return toChecksum + checksum
}

/**
 * Build dynamic amount QR code image buffer.
 * @param {string} payload
 * @param {number|string} amount
 * @returns {Promise<Buffer>}
 */
export async function buildAmountQr(payload, amount) {
  const finalString = buildAmountQrString(payload, amount)
  return await QRCode.toBuffer(finalString, { width: 512, margin: 2 })
}
