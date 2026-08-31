# Payment Methods Setup Guide

The bot now stores payment information in the database, making it easy to update without changing code.

## Initial Setup

1. **Seed the database with default payment methods:**
\`\`\`bash
npm run seed-payments
\`\`\`

This will add GCash, Maya, and PayPal to the database.

## Managing Payment Methods

Use the `/paymentsetup` command in Discord (Admin only):

### Add a new payment method
\`\`\`
/paymentsetup add 
  method: gcash
  display_name: GCash Payment
  account_number: 09690617185
  account_name: DENIELLE P.
  qr_code_url: https://your-image-url.com/qr.png
  instructions: Please send screenshot after payment
\`\`\`

### Edit an existing payment method
\`\`\`
/paymentsetup edit
  method: gcash
  account_number: 09123456789
  qr_code_url: https://new-qr-code-url.com/qr.png
\`\`\`

### List all payment methods
\`\`\`
/paymentsetup list
\`\`\`

### Remove a payment method
\`\`\`
/paymentsetup remove
  method: maya
\`\`\`

## Updating Payment QR Codes

To update the GCash QR code:

1. Upload your QR code image to a hosting service (Vercel Blob, Imgur, etc.)
2. Copy the HTTPS URL
3. Run: `/paymentsetup edit method:gcash qr_code_url:YOUR_URL_HERE`

## Payment Method Fields

- **method_name**: Unique identifier (gcash, maya, paypal, etc.)
- **display_name**: How it appears to users
- **account_number**: Your account/phone number
- **account_name**: Account holder name
- **qr_code_url**: HTTPS URL to QR code image
- **instructions**: Additional payment instructions

All fields except method_name and display_name are optional.
