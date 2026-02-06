# Bank Account & Payment Flow Implementation Guide

## Overview
This document explains the bank account management system and payment flow implementation for the ContentSellify platform.

## Money Flow

```
User (Buyer) 
    ↓ Pays 100%
Admin Account (via Razorpay)
    ↓ Keeps 10% Commission
    ↓ Pays 90% to Seller
Seller Account (via RazorpayX Payout)
```

## Features Implemented

### 1. User Model Updates
- Added `bankAccount` object with fields:
  - `accountHolderName`
  - `accountNumber`
  - `ifscCode`
  - `bankName`
  - `branchName`
  - `accountType` (savings/current)
  - `isVerified` (boolean)
- Added RazorpayX integration fields:
  - `razorpayContactId`
  - `razorpayFundAccountId`

### 2. Bank Account Management (Both Seller & Admin)

#### API Endpoints

**For Sellers and Admins:**
- `POST /api/bank/add` - Add new bank account
- `GET /api/bank` - Get bank account details
- `PUT /api/bank/update` - Update bank account
- `DELETE /api/bank/delete` - Delete bank account

**For Admin Only:**
- `GET /api/admin/sellers/bank-accounts` - View all sellers' bank accounts
- `GET /api/admin/sellers/:sellerId/bank-account` - View specific seller's bank account
- `GET /api/admin/bank-stats` - Get admin's bank stats (commission, payouts, balance)

#### Controllers
**bank.controller.js:**
- `addBankAccount()` - Creates RazorpayX contact & fund account
- `getBankAccount()` - Returns masked account details
- `updateBankAccount()` - Updates bank details (recreates RazorpayX account if critical fields change)
- `deleteBankAccount()` - Removes bank account

**admin.controller.js:**
- `getAllSellersWithBankAccounts()` - Lists all sellers with bank account status
- `getSellerBankAccount()` - View individual seller's bank details
- `getAdminBankStats()` - Commission and payout statistics

### 3. Payment Flow (Already Implemented)

The payment flow is handled in:
- `payment.controller.js` - Creates orders with 10% platform fee
- `webhook.controller.js` - Captures payments and creates invoices
- `admin.controller.js` - Approves payouts to sellers

**Flow:**
1. Buyer pays via Razorpay (money goes to admin account)
2. Order is created with:
   - `amount`: Total price
   - `platformFee`: 10% of amount
   - `sellerAmount`: 90% of amount
3. Payment webhook updates order status to "paid"
4. Seller requests withdrawal
5. Admin approves payout
6. RazorpayX transfers `sellerAmount` to seller's bank account

### 4. Frontend Components

**Seller Dashboard:**
- `/dashboard/seller/bank-account/page.tsx` - Bank account management form

**Admin Dashboard:**
- `/dashboard/admin/bank-account/page.tsx` - Admin bank account + statistics

Both components include:
- Add/Edit/Delete bank account
- Form validation
- Masked account number display
- Verification status
- IFSC code format validation

## Required Environment Variables

Add these to your `.env` file:

```env
# Razorpay (for receiving payments)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxx

# RazorpayX (for payouts to sellers)
RAZORPAYX_KEY_ID=rzpx_test_xxxxxxxxxxxxx
RAZORPAYX_KEY_SECRET=xxxxxxxxxxxxx
RAZORPAYX_ACCOUNT_NUMBER=xxxxxxxxxxxxx

# Database
MONGODB_URI=mongodb://localhost:27017/contentSellify

# JWT
JWT_SECRET=your_jwt_secret_here
```

## API Keys You Need

### 1. Razorpay Account (for receiving payments)
**Sign up:** https://dashboard.razorpay.com/signup

After signup:
1. Go to Settings → API Keys
2. Generate Test/Live Keys
3. Copy `Key ID` and `Key Secret`
4. Go to Settings → Webhooks
5. Create webhook for `payment.captured` event
6. Copy the `Webhook Secret`

**Paste in .env:**
```
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 2. RazorpayX Account (for payouts)
**Sign up:** https://x.razorpay.com/

**Note:** RazorpayX requires KYC verification and may take 1-2 business days

After approval:
1. Go to Settings → API Keys (RazorpayX section)
2. Generate Test/Live Keys
3. Copy `Key ID` and `Key Secret`
4. Go to Current Account section
5. Copy your `Account Number`

**Paste in .env:**
```
RAZORPAYX_KEY_ID=your_razorpayx_key_id
RAZORPAYX_KEY_SECRET=your_razorpayx_key_secret
RAZORPAYX_ACCOUNT_NUMBER=your_account_number
```

## Testing

### Test Bank Accounts (For Testing RazorpayX)
Use these test bank account details:

```
Account Number: 1234567890
IFSC Code: SBIN0007105
Account Holder Name: Test User
Bank Name: State Bank of India
Account Type: Savings
```

### Test Flow:
1. **Seller adds bank account:**
   ```bash
   POST /api/bank/add
   {
     "accountHolderName": "John Seller",
     "accountNumber": "1234567890",
     "ifscCode": "SBIN0007105",
     "bankName": "State Bank of India",
     "accountType": "savings"
   }
   ```

2. **Admin adds their bank account:**
   ```bash
   POST /api/bank/add
   {
     "accountHolderName": "ContentSellify Platform",
     "accountNumber": "9876543210",
     "ifscCode": "HDFC0001234",
     "bankName": "HDFC Bank",
     "accountType": "current"
   }
   ```

3. **Buyer makes purchase:**
   - Payment goes to admin's Razorpay account
   - 10% commission auto-calculated
   - 90% marked for seller

4. **Seller requests withdrawal:**
   ```bash
   POST /api/seller/request-withdrawal
   {
     "amount": 900
   }
   ```

5. **Admin approves payout:**
   ```bash
   POST /api/admin/payouts/:id/approve
   ```
   - Money transferred via RazorpayX to seller's bank account

## Security Features

1. **Account Number Masking:** Only last 4 digits shown in API responses
2. **Role-Based Access:** Sellers and admins can only manage their own accounts
3. **Validation:** IFSC code format validation
4. **RazorpayX Integration:** Automatic bank account verification
5. **Secure Webhooks:** Signature verification for payment webhooks

## Important Notes

1. **RazorpayX KYC Required:** RazorpayX requires business KYC verification. Use test mode for development.

2. **Test vs Live Mode:** 
   - Test keys start with `rzp_test_` and `rzpx_test_`
   - Live keys start with `rzp_live_` and `rzpx_live_`
   - Never commit live keys to git!

3. **Bank Account Updates:** 
   - Updating critical fields (account number, IFSC, holder name) recreates the RazorpayX fund account
   - This is required as RazorpayX doesn't allow updating these fields

4. **Commission Rate:**
   - Currently set to 10% in `payment.controller.js`
   - Modify `platformFee` calculation to change commission rate

5. **Payout Modes:**
   - IMPS: Instant (24/7)
   - NEFT: 30 min - 2 hours (banking hours)
   - RTGS: 30 min (banking hours, min ₹2 lakhs)

## Database Schema

### User Model (Updated)
```javascript
{
  name: String,
  email: String,
  role: String, // 'buyer', 'seller', 'admin'
  
  // New bank account fields
  bankAccount: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branchName: String,
    accountType: String, // 'savings' or 'current'
    isVerified: Boolean
  },
  razorpayContactId: String,
  razorpayFundAccountId: String
}
```

### Order Model (Existing)
```javascript
{
  buyerId: ObjectId,
  sellerId: ObjectId,
  productId: ObjectId,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  amount: Number, // Total amount
  platformFee: Number, // 10% commission
  sellerAmount: Number, // 90% for seller
  status: String // 'created', 'paid', 'failed'
}
```

### Payout Model (Existing)
```javascript
{
  sellerId: ObjectId,
  amount: Number,
  status: String, // 'pending', 'approved', 'paid', 'rejected'
  razorpayPayoutId: String,
  rejectionReason: String,
  failureReason: String
}
```

## Troubleshooting

### Issue: "Seller bank account not added"
**Solution:** Seller must add bank account before requesting withdrawal

### Issue: "Invalid IFSC code"
**Solution:** IFSC format must be: 4 letters + 0 + 6 alphanumeric characters (e.g., SBIN0001234)

### Issue: "RazorpayX payout failed"
**Possible causes:**
- Insufficient balance in RazorpayX account
- Invalid bank account details
- RazorpayX account not activated
- Network issues

**Solution:** Check RazorpayX dashboard for detailed error message

### Issue: "Bank account already exists"
**Solution:** User can only have one bank account. Delete existing account first or use update endpoint

## Support & Resources

- **Razorpay Docs:** https://razorpay.com/docs/
- **RazorpayX Docs:** https://razorpay.com/docs/razorpayx/
- **Razorpay Dashboard:** https://dashboard.razorpay.com/
- **RazorpayX Dashboard:** https://x.razorpay.com/

## Next Steps

1. Sign up for Razorpay and RazorpayX accounts
2. Complete KYC verification for RazorpayX
3. Add API keys to `.env` file
4. Test the complete flow in test mode
5. Switch to live keys when ready for production

## License & Compliance

- Ensure compliance with RBI guidelines for payment processing
- Maintain proper accounting records for GST
- Store sensitive bank details securely
- Follow PCI DSS guidelines for payment data

---

**Need Help?**
Contact Razorpay support: support@razorpay.com
