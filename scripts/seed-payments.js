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
    "09690617185",
    "DENIELLE P.",
    "https://cdn.discordapp.com/attachments/1450105322428432445/1450105646455328950/gcash.jpg?ex=6941539f&is=6940021f&hm=342a4a698977c0000e2100dfd25e32a7dfa106d20871302e780afdc38d0da43d&",

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
    "0962652755", // Account Number
    "JAMAICA CABALLERO", // Account Name
    "https://cdn.discordapp.com/attachments/1450105322428432445/1450105645868122183/maya.jpg?ex=6941539f&is=6940021f&hm=a6ae8cccc99963da241d99089f61921b600356ab8fefe02dd5d88de2c119d1f4&",
    "Please send payment to this Maya number."
  )
  console.log("✓ Added Maya payment method")
} catch (error) {
  console.log("Maya already exists. Updating details...", error.message)
  try {
    paymentModel.update("maya", {
      accountNumber: "09626527755",
      accountName: "JAMAICA CABALLERO",
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
