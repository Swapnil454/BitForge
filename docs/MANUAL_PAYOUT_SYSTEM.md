# Manual Payout System

## Overview
This system allows admins to manually process seller payouts with automatic commission and GST calculation. RazorpayX is temporarily disabled and can be re-enabled in the future.

## Financial Breakdown

### Commission Structure
- **Platform Commission**: 10% of the withdrawal amount
- **GST on Commission**: 18% of the platform commission
- **Total Deductions**: Platform Commission + GST
- **Net Payable Amount**: Withdrawal Amount - Total Deductions

### Example Calculation
```
Seller requests withdrawal: ₹10,000

Platform Commission (10%): ₹1,000
GST on Commission (18% of ₹1,000): ₹180
Total Deductions: ₹1,180
Net Payable to Seller: ₹8,820
```

## Payout Workflow

### 1. Seller Requests Withdrawal
- Seller goes to their dashboard and requests a withdrawal
- System automatically calculates:
  - Platform commission
  - GST on commission
  - Net payable amount
- Payout is created with status: `pending`

**API Endpoint**: `POST /api/seller/request-withdrawal`
```json
{
  "amount": 10000
}
```

**Response**:
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

### 2. Admin Reviews Pending Payouts
- Admin can view all pending payouts with detailed breakdown
- Each payout shows:
  - Seller details
  - Primary bank account information
  - Financial breakdown (commission, GST, net amount)

**API Endpoint**: `GET /api/admin/payouts/pending`

**Response**:
```json
[
  {
    "_id": "payout_id",
    "seller": {
      "id": "seller_id",
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

### 3. Admin Processes Payment Manually
- Admin transfers money to seller's primary bank account
- Admin marks the payout as paid with:
  - Payment reference (UTR number)
  - Payment notes (optional)
  - Payment method (manual/bank_transfer/upi)

**API Endpoint**: `POST /api/admin/payouts/:id/approve`

**Request**:
```json
{
  "paymentReference": "UTR123456789",
  "paymentNotes": "Paid via NEFT",
  "paymentMethod": "bank_transfer"
}
```

**Response**:
```json
{
  "message": "Payout marked as paid successfully",
  "payout": {
    "id": "payout_id",
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

## Admin Dashboard Endpoints

### Get All Payouts (with filters)
**Endpoint**: `GET /api/admin/payouts/all?status=paid&page=1&limit=50`

Query Parameters:
- `status`: Filter by status (pending/processing/paid/rejected)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)

### Get Payout Details
**Endpoint**: `GET /api/admin/payouts/:id`

Returns detailed information about a specific payout including full financial breakdown and payment history.

### Get Commission Summary
**Endpoint**: `GET /api/admin/commission-summary?startDate=2026-01-01&endDate=2026-01-31`

Returns comprehensive financial summary:
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

### Reject Payout
**Endpoint**: `POST /api/admin/payouts/:id/reject`

**Request**:
```json
{
  "reason": "Insufficient verification documents"
}
```

## Payout Status Flow

```
pending → paid
   ↓
rejected
```

- **pending**: Seller has requested withdrawal, awaiting admin action
- **processing**: (Reserved for future RazorpayX automation)
- **paid**: Admin has manually processed and confirmed payment
- **rejected**: Admin rejected the payout request

## Database Schema Updates

### Payout Model
```javascript
{
  sellerId: ObjectId,
  amount: Number,                    // Total amount seller requested
  totalEarnings: Number,              // Total earnings from sales
  platformCommission: Number,         // 10% of amount
  gstOnCommission: Number,            // 18% of platformCommission
  totalDeductions: Number,            // platformCommission + gstOnCommission
  netPayableAmount: Number,           // amount - totalDeductions
  
  status: String,                     // pending/processing/paid/rejected
  rejectionReason: String,
  
  // Manual payment tracking
  paidBy: ObjectId,                   // Admin who processed payment
  paidAt: Date,
  paymentMethod: String,              // manual/bank_transfer/upi/razorpayx
  paymentReference: String,           // UTR number
  paymentNotes: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

## Re-enabling RazorpayX (Future)

When ready to enable automated payouts:

1. **Uncomment RazorpayX configuration**:
   - File: `server/src/config/razorpayx.js`
   - Uncomment the import and export statements

2. **Update admin controller**:
   - File: `server/src/controllers/admin.controller.js`
   - Uncomment the razorpayX import
   - Modify `approvePayout` function to use RazorpayX API

3. **Configure environment variables**:
   ```env
   RAZORPAYX_KEY_ID=rzpx_live_xxxxxxxxxxxxx
   RAZORPAYX_KEY_SECRET=your_live_secret_key
   RAZORPAYX_ACCOUNT_NUMBER=your_account_number
   ```

4. **Test in sandbox** before going live

## Testing the Manual Payout System

### 1. Create a test seller account
### 2. Make test purchases
### 3. Request withdrawal as seller
### 4. View pending payouts as admin
### 5. Process payment manually
### 6. Verify payout status

## Security Considerations

1. **Admin Authentication**: Only admins can approve/reject payouts
2. **Payment Reference**: Always save UTR or transaction reference
3. **Audit Trail**: All payouts track who paid and when
4. **Balance Validation**: System prevents over-withdrawal
5. **Commission Transparency**: All calculations are saved in database

## Benefits of Manual Payout System

✅ **Full Control**: Admin reviews every payout before processing
✅ **Transparency**: Sellers see commission breakdown when requesting
✅ **Flexibility**: Can use any payment method (NEFT, RTGS, UPI, etc.)
✅ **Cost Savings**: No RazorpayX transaction fees during early stage
✅ **Easy Migration**: Can switch to automated payouts anytime

## Support & Troubleshooting

### Common Issues

**Issue**: Seller can't see their bank account
- **Solution**: Ensure seller has added and verified a primary bank account

**Issue**: Net payable amount doesn't match expectations
- **Solution**: Remember it's 10% commission + 18% GST on that commission (total 11.8% deduction)

**Issue**: Admin can't approve payout
- **Solution**: Verify admin role and seller has a verified primary bank account

---

**Last Updated**: January 26, 2026
**Version**: 1.0.0
