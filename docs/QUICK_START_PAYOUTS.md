# ⚡ Quick Start: Manual Payout System

## 🎯 What Changed?

**Before**: RazorpayX automated payouts ❌  
**Now**: Manual payouts with commission tracking ✅

---

## 💰 Money Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SELLER REQUESTS ₹10,000                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  System Calculates:        │
        │  • Commission: ₹1,000      │
        │  • GST: ₹180               │
        │  • Net: ₹8,820             │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   ADMIN SEES REQUEST       │
        │   with full breakdown      │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  ADMIN TRANSFERS ₹8,820    │
        │  to seller's bank account  │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  ADMIN MARKS AS PAID       │
        │  with UTR reference        │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  PLATFORM KEEPS ₹1,180     │
        │  (commission + GST)        │
        └────────────────────────────┘
```

---

## 📱 For Admins: 3 Simple Steps

### Step 1️⃣: View Pending Payouts
```
GET /api/admin/payouts/pending
```
You'll see:
- Seller name & email
- Bank account details
- **Net amount to pay** (already calculated!)

### Step 2️⃣: Transfer Money
- Open your bank app
- Transfer the **Net Payable Amount**
- Save the UTR number

### Step 3️⃣: Mark as Paid
```
POST /api/admin/payouts/:id/approve
{
  "paymentReference": "UTR123456789",
  "paymentMethod": "bank_transfer"
}
```

✅ **Done!** Seller gets paid, you keep commission.

---

## 💵 Commission Breakdown

| Amount | Commission (10%) | GST (18%) | You Keep | Seller Gets |
|--------|------------------|-----------|----------|-------------|
| ₹1,000 | ₹100 | ₹18 | ₹118 | ₹882 |
| ₹5,000 | ₹500 | ₹90 | ₹590 | ₹4,410 |
| ₹10,000 | ₹1,000 | ₹180 | ₹1,180 | ₹8,820 |
| ₹50,000 | ₹5,000 | ₹900 | ₹5,900 | ₹44,100 |
| ₹100,000 | ₹10,000 | ₹1,800 | ₹11,800 | ₹88,200 |

**Your effective commission rate: 11.8%**

---

## 📊 Admin Dashboard APIs

### View Pending
```bash
GET /api/admin/payouts/pending
```

### View All History
```bash
GET /api/admin/payouts/all?status=paid
```

### Commission Summary
```bash
GET /api/admin/commission-summary
```
Shows:
- Total commission earned
- Total GST collected
- Total paid to sellers
- Net platform balance

### Approve Payout
```bash
POST /api/admin/payouts/:id/approve
{
  "paymentReference": "UTR123456789",
  "paymentNotes": "Paid via NEFT",
  "paymentMethod": "bank_transfer"
}
```

### Reject Payout
```bash
POST /api/admin/payouts/:id/reject
{
  "reason": "Verification needed"
}
```

---

## 🏦 For Sellers

### Request Withdrawal
```bash
POST /api/seller/request-withdrawal
{
  "amount": 10000
}
```

**Response shows exact breakdown:**
```json
{
  "requestedAmount": 10000,
  "platformCommission": 1000,
  "gstOnCommission": 180,
  "totalDeductions": 1180,
  "netPayableAmount": 8820
}
```

### Check Balance
```bash
GET /api/seller/balance
```

**Response:**
```json
{
  "totalEarnings": 50000,
  "withdrawn": 20000,
  "pendingWithdrawals": 10000,
  "availableBalance": 20000
}
```

---

## 🎨 Visual Example

### Payout Request Flow

```
SELLER                    SYSTEM                    ADMIN
  │                         │                         │
  │───Request ₹10,000──────▶│                         │
  │                         │                         │
  │◀──You'll get ₹8,820────│                         │
  │                         │                         │
  │                         │───View Request─────────▶│
  │                         │                         │
  │                         │◀──Make Transfer─────────│
  │                         │                         │
  │◀──Payment Confirmed────│◀──Mark as Paid──────────│
  │                         │                         │
  │    Receives ₹8,820      │  Platform keeps ₹1,180  │
  │                         │                         │
```

---

## 📚 Documentation Index

| Document | Purpose | Audience |
|----------|---------|----------|
| **README_CHANGES.md** | Overview & quick start | Everyone |
| **ADMIN_PAYOUT_GUIDE.md** | Step-by-step processing | Admins |
| **PAYOUT_API_REFERENCE.md** | API endpoints | Developers |
| **MANUAL_PAYOUT_SYSTEM.md** | Complete technical guide | Developers |
| **MIGRATION_SUMMARY.md** | Implementation details | Tech team |

---

## ⚡ Quick Commands

### Test Seller Flow
```bash
# Login as seller
# Request withdrawal
curl -X POST "http://localhost:5000/api/seller/request-withdrawal" \
  -H "Authorization: Bearer SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":10000}'
```

### Test Admin Flow
```bash
# Login as admin
# View pending
curl -X GET "http://localhost:5000/api/admin/payouts/pending" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Approve payout
curl -X POST "http://localhost:5000/api/admin/payouts/PAYOUT_ID/approve" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentReference":"UTR123456","paymentMethod":"bank_transfer"}'
```

---

## ✅ Checklist: First Payout

Processing your first payout? Follow this:

- [ ] Seller has added & verified bank account
- [ ] Seller requests withdrawal
- [ ] You login as admin
- [ ] View pending payouts
- [ ] Verify seller identity
- [ ] Check bank account details
- [ ] Transfer **netPayableAmount** (not requested amount!)
- [ ] Save UTR number
- [ ] Mark payout as paid with UTR
- [ ] Verify seller received money
- [ ] Check commission summary

---

## 🔥 Pro Tips

### Always Remember
✅ Transfer **netPayableAmount** (the smaller amount)  
✅ Save **UTR/transaction reference** every time  
✅ Platform commission = 10% + GST (18% on commission)  
✅ Effective rate = 11.8% total

### Never Do
❌ Don't transfer requested amount (transfer net amount)  
❌ Don't skip UTR reference  
❌ Don't process without verifying seller  
❌ Don't forget to mark as paid in system

---

## 🎯 At a Glance

| Feature | Status |
|---------|--------|
| Manual payouts | ✅ Active |
| Commission tracking | ✅ Active |
| GST calculation | ✅ Active |
| Admin dashboard | ✅ Active |
| Seller transparency | ✅ Active |
| Audit trail | ✅ Active |
| RazorpayX | ⏸️ Disabled (can re-enable) |

---

## 🚀 Start Using Now

1. **Admin**: Visit `/api/admin/payouts/pending`
2. **Seller**: Visit `/api/seller/request-withdrawal`
3. **Check earnings**: Visit `/api/admin/commission-summary`

---

## 📞 Need Help?

- **"How do I process a payout?"** → Read `ADMIN_PAYOUT_GUIDE.md`
- **"What are the API endpoints?"** → Read `PAYOUT_API_REFERENCE.md`
- **"How does commission work?"** → You keep 11.8% of every withdrawal
- **"Can I automate this?"** → Yes! Re-enable RazorpayX (see docs)

---

**🎉 You're ready to process payouts manually!**

**Status**: ✅ Production Ready  
**Date**: January 26, 2026  
**Version**: 1.0.0

---

## 🔗 Quick Links

- Full Guide: `MANUAL_PAYOUT_SYSTEM.md`
- API Docs: `PAYOUT_API_REFERENCE.md`
- Admin Guide: `ADMIN_PAYOUT_GUIDE.md`
- Tech Details: `MIGRATION_SUMMARY.md`
