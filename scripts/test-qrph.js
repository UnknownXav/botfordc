import assert from "node:assert"
import {
  parseTLV,
  buildTLV,
  crc16,
  isValidQrPayload,
  buildAmountQrString,
  buildAmountQr,
} from "../src/utils/qrph.js"

console.log("Running QR Ph helper self-test...")

// 1. Build a sample payload programmatically with tags 00, 01, 26, 52, 53, 58, 59, 60
const sampleItems = [
  { tag: "00", val: "01" },
  { tag: "01", val: "11" },
  { tag: "26", val: "0010A00000072701040000" },
  { tag: "52", val: "0000" },
  { tag: "53", val: "608" },
  { tag: "58", val: "PH" },
  { tag: "59", val: "DUMMY STORE" },
  { tag: "60", val: "MANILA" },
]

const tlvWithoutCrc = buildTLV(sampleItems) + "6304"
const sampleCrc = crc16(tlvWithoutCrc)
const samplePayload = tlvWithoutCrc + sampleCrc

console.log(`Generated sample payload: ${samplePayload}`)

// 2. Assert isValidQrPayload(sample) is true
assert.strictEqual(isValidQrPayload(samplePayload), true, "samplePayload should be valid")
console.log("✓ isValidQrPayload(samplePayload) is true")

// 3. Build with amount 250
const resultString = buildAmountQrString(samplePayload, 250)
console.log(`Generated amount QR payload: ${resultString}`)

// 4. Assert the result string contains "5406250.00"
assert.ok(resultString.includes("5406250.00"), "resultString should contain 5406250.00")
console.log("✓ Result string contains '5406250.00'")

// 5. Assert its CRC is valid
assert.strictEqual(isValidQrPayload(resultString), true, "resultString CRC should be valid")
console.log("✓ Result string CRC is valid (isValidQrPayload is true)")

// 6. Test buildAmountQr generates a valid Buffer
const qrBuffer = await buildAmountQr(samplePayload, 250)
assert.ok(Buffer.isBuffer(qrBuffer), "buildAmountQr should return a Buffer")
assert.ok(qrBuffer.length > 0, "QR buffer should not be empty")
console.log(`✓ buildAmountQr returned a PNG Buffer of ${qrBuffer.length} bytes`)

console.log("All QR Ph self-tests passed successfully!")
