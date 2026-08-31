import "dotenv/config"
import { initDb } from "../src/database/init.js"
import { paymentModel } from "../src/database/models/payment.js"

// Initialize database
await initDb()

console.log("Seeding payment methods...")

// Add GCash payment method
try {
  paymentModel.create(
    "gcash",
    "GCash Payment",
    process.env.SEED_GCASH_NUMBER || "09123456789",
    process.env.SEED_GCASH_NAME || "GCash Account",
    process.env.SEED_GCASH_QR_URL || "https://example.com/gcash-qr.png",
  )
  console.log("✓ Added GCash payment method")
} catch (error) {
  console.log("GCash already exists or error:", error.message)
}

// Add Maya payment method with QR code
try {
  paymentModel.create(
    "maya",
    "Maya Payment",
    process.env.SEED_MAYA_NUMBER || "09123456789",
    process.env.SEED_MAYA_NAME || "Maya Account",
    process.env.SEED_MAYA_QR_URL || "https://example.com/maya-qr.png",
    "Please send payment to this Maya number."
  )
  console.log("✓ Added Maya payment method")
} catch (error) {
  console.log("Maya already exists. Updating details...", error.message)
  try {
    paymentModel.update("maya", {
      accountNumber: process.env.SEED_MAYA_NUMBER || "09123456789",
      accountName: process.env.SEED_MAYA_NAME || "Maya Account",
      instructions: "Please send payment to this Maya number."
    })
    console.log("✓ Updated Maya payment method")
  } catch (updateError) {
    console.log("Failed to update Maya:", updateError.message)
  }
}

// Add PayPal payment method with QR code
try {
  paymentModel.create("paypal", "PayPal Payment", null, null, null, "PayPal payment details coming soon!")
  console.log("✓ Added PayPal payment method")
} catch (error) {
  console.log("PayPal already exists or error:", error.message)
}

console.log("Payment methods seeded successfully!")
process.exit(0)
