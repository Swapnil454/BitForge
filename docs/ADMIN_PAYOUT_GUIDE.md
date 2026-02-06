# 📋 Admin Manual Payout Processing Guide

## Quick Start

This is a step-by-step guide for admins to process seller payouts manually.

---

## 🔍 Step 1: View Pending Payouts

### API Call
```bash
GET /api/admin/payouts/pending
Authorization: Bearer <your_admin_token>
```

### What You'll See
```json
{
  "seller": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "primaryBankAccount": {
    "accountHolderName": "John Doe",
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234",
    "bankName": "State Bank of India",
    "branchName": "Mumbai Main"
  },
  "financialBreakdown": {
    "requestedAmount": 10000,      // What seller requested
    "platformCommission": 1000,     // Our 10% commission
    "gstOnCommission": 180,         // 18% GST on commission
    "totalDeductions": 1180,        // Total we keep
    "netPayableAmount": 8820        // 💰 TRANSFER THIS AMOUNT
  }
}
```

---

## 💸 Step 2: Make Bank Transfer

### Important: Transfer the **Net Payable Amount**, NOT the requested amount!

#### Using Net Banking
1. Login to your bank's net banking
2. Select "Fund Transfer" or "NEFT/RTGS/IMPS"
3. Add beneficiary (if first time):
   - **Name**: `accountHolderName` from response
   - **Account Number**: `accountNumber` from response
   - **IFSC Code**: `ifscCode` from response
   - **Bank**: `bankName` from response

4. Enter amount: **`netPayableAmount`** (₹8,820 in example)
5. Complete the transfer
6. **Save the UTR number** (e.g., UTR123456789)

#### Using UPI
1. Open your UPI app
2. Enter UPI ID or scan QR code
3. Enter amount: **`netPayableAmount`**
4. Add note: "Payout for order"
5. Complete payment
6. **Save the transaction ID**

---

## ✅ Step 3: Mark Payout as Paid

### API Call
```bash
POST /api/admin/payouts/:payoutId/approve
Authorization: Bearer <your_admin_token>
Content-Type: application/json

{
  "paymentReference": "UTR123456789",
  "paymentNotes": "Paid via NEFT on 26th Jan 2026, 2:30 PM",
  "paymentMethod": "bank_transfer"
}
```

### Payment Methods
- `manual` - Generic manual payment
- `bank_transfer` - NEFT/RTGS/IMPS
- `upi` - UPI payment
- `razorpayx` - RazorpayX automated (future)

### Fields Explanation
- **paymentReference** (required): UTR or transaction ID from bank
- **paymentNotes** (optional): Any additional info
- **paymentMethod** (optional): Defaults to "manual"

---

## 📊 Step 4: View Financial Summary

### Check Total Commission Earned

```bash
GET /api/admin/commission-summary
Authorization: Bearer <your_admin_token>
```

### Response
```json
{
  "summary": {
    "totalPayouts": 150,
    "totalAmountProcessed": 1500000,    // Total sellers requested
    "totalCommissionEarned": 150000,    // Our commission (10%)
    "totalGSTCollected": 27000,         // GST collected (18% of commission)
    "totalPayoutsMade": 1323000,        // Total paid to sellers
    "totalRetainedByPlatform": 177000   // Commission + GST = Our income
  }
}
```

### Filter by Date Range
```bash
GET /api/admin/commission-summary?startDate=2026-01-01&endDate=2026-01-31
```

---

## 🚫 Rejecting a Payout

If you need to reject a payout (e.g., suspicious activity, verification needed):

```bash
POST /api/admin/payouts/:payoutId/reject
Authorization: Bearer <your_admin_token>
Content-Type: application/json

{
  "reason": "Bank account verification required. Please update your KYC documents."
}
```

The seller will receive this rejection reason.

---

## 💡 Quick Reference Card

### Commission Calculation
```
┌─────────────────────────────────────┐
│ Seller Requested:      ₹10,000      │
├─────────────────────────────────────┤
│ Platform Fee (10%):    - ₹1,000     │
│ GST on Fee (18%):      - ₹180       │
├─────────────────────────────────────┤
│ YOU PAY TO SELLER:     ₹8,820 ✅    │
├─────────────────────────────────────┤
│ YOU KEEP:              ₹1,180 💰    │
└─────────────────────────────────────┘
```

### Effective Commission
```
You keep 11.8% of every withdrawal request
- 10% platform commission
- 1.8% GST on commission (18% of 10%)
```

---

## 📋 Daily Payout Processing Checklist

- [ ] Check pending payouts
- [ ] Verify seller bank account details
- [ ] Calculate net payable amount (already calculated by system)
- [ ] Make bank transfer
- [ ] Save UTR/transaction reference
- [ ] Mark payout as paid in system
- [ ] Keep transaction proof for records

---

## 🔍 View All Payouts

### With Filters
```bash
# Get all paid payouts
GET /api/admin/payouts/all?status=paid

# Get recent payouts with pagination
GET /api/admin/payouts/all?page=1&limit=50

# Get rejected payouts
GET /api/admin/payouts/all?status=rejected
```

### Status Values
- `pending` - Awaiting your action
- `paid` - You've processed it
- `rejected` - You've rejected it
- `processing` - (Reserved for future automated payouts)

---

## 🔐 Security Best Practices

### Always:
✅ Verify seller identity before large payouts
✅ Check bank account matches seller's name
✅ Save UTR/transaction reference
✅ Process payouts during business hours
✅ Double-check the amount (use netPayableAmount)

### Never:
❌ Pay to a different bank account
❌ Skip saving the UTR number
❌ Process suspicious requests immediately
❌ Share your admin credentials

---

## 🐛 Troubleshooting

### "Seller primary bank account not found"
**Solution**: Ask seller to add and verify a primary bank account

### Wrong amount transferred
**Problem**: Transferred `requestedAmount` instead of `netPayableAmount`
**Solution**: 
1. Request seller to return the difference
2. Or adjust next payout accordingly
3. Learn: Always transfer `netPayableAmount` only

### UTR not saved
**Problem**: Forgot to save payment reference
**Solution**: Go to your bank statement, find the transaction, get UTR

### Can't find pending payout
**Solution**: Use `GET /api/admin/payouts/all?status=pending` instead

---

## 📱 Mobile-Friendly Commands

If you're processing from mobile, you can use Postman mobile app or curl commands.

### Quick View Pending
```bash
curl -X GET "https://yourapi.com/api/admin/payouts/pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Quick Approve
```bash
curl -X POST "https://yourapi.com/api/admin/payouts/PAYOUT_ID/approve" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentReference":"UTR123","paymentMethod":"upi"}'
```

---

## 📊 Example: Processing First Payout

### Scenario
Seller "Jane Smith" requests ₹50,000 withdrawal

### Step-by-Step

1️⃣ **View Request**
```json
{
  "requestedAmount": 50000,
  "netPayableAmount": 44100  // ← Transfer this
}
```

2️⃣ **Bank Transfer**
- Login to net banking
- Transfer ₹44,100 to Jane's account
- Get UTR: UTR987654321

3️⃣ **Mark as Paid**
```json
{
  "paymentReference": "UTR987654321",
  "paymentNotes": "Paid on 26 Jan 2026",
  "paymentMethod": "bank_transfer"
}
```

4️⃣ **Done!** ✅
- Jane receives ₹44,100
- You keep ₹5,900 (commission + GST)

---

## 🎯 Monthly Reconciliation

At month end, verify:

1. **Total Commission Earned** = Sum of all `platformCommission`
2. **Total GST Collected** = Sum of all `gstOnCommission`
3. **Total Paid Out** = Sum of all `netPayableAmount`

Use the commission summary endpoint for automated calculation.

---

## 📞 Need Help?

- **Documentation**: Check `MANUAL_PAYOUT_SYSTEM.md`
- **API Reference**: Check `PAYOUT_API_REFERENCE.md`
- **Technical Issues**: Check server logs

---

**Last Updated**: January 26, 2026
**For**: Admin Dashboard
