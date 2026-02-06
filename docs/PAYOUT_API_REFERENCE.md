# Manual Payout API Quick Reference

## 🔐 Authentication
All endpoints require authentication. Admin endpoints require admin role.

---

## 👨‍💼 Seller Endpoints

### Get Balance
```http
GET /api/seller/balance
Authorization: Bearer <token>
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

### Request Withdrawal
```http
POST /api/seller/request-withdrawal
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 10000
}
```

**Response:**
```json
{
  "message": "Withdrawal request submitted",
  "breakdown": {
    "requestedAmount": 10000,
    "platformCommission": 1000,
    "gstOnCommission": 180,
    "totalDeductions": 1180,
    "netPayableAmount": 8820
  }
}
```

---

## 🛡️ Admin Endpoints

### Get Pending Payouts
```http
GET /api/admin/payouts/pending
Authorization: Bearer <admin_token>
```

**Response:**
```json
[
  {
    "_id": "65abc123...",
    "seller": {
      "id": "65abc456...",
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
      "requestedAmount": 10000,
      "platformCommission": 1000,
      "gstOnCommission": 180,
      "totalDeductions": 1180,
      "netPayableAmount": 8820
    },
    "status": "pending",
    "createdAt": "2026-01-26T10:00:00.000Z"
  }
]
```

### Get All Payouts (with filters)
```http
GET /api/admin/payouts/all?status=paid&page=1&limit=50
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `status` (optional): pending | processing | paid | rejected
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Response:**
```json
{
  "payouts": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

### Get Payout Details
```http
GET /api/admin/payouts/:id
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "_id": "65abc123...",
  "seller": {
    "id": "65abc456...",
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
    "requestedAmount": 10000,
    "platformCommission": 1000,
    "gstOnCommission": 180,
    "totalDeductions": 1180,
    "netPayableAmount": 8820
  },
  "status": "paid",
  "paymentMethod": "bank_transfer",
  "paymentReference": "UTR123456789",
  "paymentNotes": "Paid via NEFT",
  "paidBy": {
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "paidAt": "2026-01-26T11:00:00.000Z",
  "createdAt": "2026-01-26T10:00:00.000Z",
  "updatedAt": "2026-01-26T11:00:00.000Z"
}
```

### Approve Payout (Mark as Paid)
```http
POST /api/admin/payouts/:id/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "paymentReference": "UTR123456789",
  "paymentNotes": "Paid via NEFT on 26th Jan",
  "paymentMethod": "bank_transfer"
}
```

**Payment Methods:** manual | bank_transfer | upi | razorpayx

**Response:**
```json
{
  "message": "Payout marked as paid successfully",
  "payout": {
    "id": "65abc123...",
    "seller": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "bankAccount": {
      "accountHolderName": "John Doe",
      "accountNumber": "1234567890",
      "ifscCode": "SBIN0001234",
      "bankName": "State Bank of India"
    },
    "amount": 8820,
    "paymentReference": "UTR123456789",
    "paidAt": "2026-01-26T11:00:00.000Z"
  }
}
```

### Reject Payout
```http
POST /api/admin/payouts/:id/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Insufficient KYC documents"
}
```

**Response:**
```json
{
  "message": "Payout rejected",
  "payout": {
    "_id": "65abc123...",
    "status": "rejected",
    "rejectionReason": "Insufficient KYC documents"
  }
}
```

### Get Commission Summary
```http
GET /api/admin/commission-summary?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "summary": {
    "totalPayouts": 150,
    "totalAmountProcessed": 1500000,
    "totalCommissionEarned": 150000,
    "totalGSTCollected": 27000,
    "totalPayoutsMade": 1323000,
    "totalRetainedByPlatform": 177000
  },
  "breakdown": {
    "commissionRate": "10%",
    "gstRate": "18%",
    "effectiveCommissionWithGST": "11.8%"
  },
  "dateRange": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  }
}
```

---

## 💰 Commission Calculation

```javascript
// Example: Seller requests ₹10,000 withdrawal

Requested Amount:       ₹10,000
Platform Commission:    ₹1,000   (10% of ₹10,000)
GST on Commission:      ₹180     (18% of ₹1,000)
─────────────────────────────────
Total Deductions:       ₹1,180
Net Payable to Seller:  ₹8,820   ✅ Transfer this amount
```

**Formula:**
```
platformCommission = amount × 0.10
gstOnCommission = platformCommission × 0.18
totalDeductions = platformCommission + gstOnCommission
netPayableAmount = amount - totalDeductions
```

---

## 📊 Payout Status Flow

```
┌─────────┐
│ pending │  ← Seller requests withdrawal
└────┬────┘
     │
     ├─→ ┌──────────┐
     │   │ rejected │  ← Admin rejects (with reason)
     │   └──────────┘
     │
     └─→ ┌──────┐
         │ paid │  ← Admin confirms payment (with UTR)
         └──────┘
```

---

## 🔍 Error Responses

### 400 Bad Request
```json
{
  "message": "Insufficient balance"
}
```

### 404 Not Found
```json
{
  "message": "Payout not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to fetch pending payouts"
}
```

---

## 📝 Notes

1. **Net Payable Amount**: This is what admin should transfer to seller
2. **Payment Reference**: Always save UTR/transaction ID
3. **Primary Bank Account**: Payout goes to seller's primary account only
4. **Audit Trail**: System tracks who paid and when
5. **Balance Check**: Sellers can't withdraw more than available balance

---

**Last Updated**: January 26, 2026
