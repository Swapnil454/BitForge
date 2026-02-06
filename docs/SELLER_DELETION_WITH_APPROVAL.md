# Seller Account Deletion with Admin Approval - Implementation Complete

## Overview
Implemented a complete account deletion system with different flows for buyers and sellers:
- **Buyers**: Delete account immediately (no admin approval needed) - admin receives notification after deletion
- **Sellers**: Request account deletion → Admin reviews → Admin approves/rejects

## Changes Made

### Server Changes

#### 1. User Model (`server/src/models/User.js`)
Added fields for seller deletion requests:
```javascript
deletionRequestStatus: {
  type: String,
  enum: ['none', 'pending', 'approved', 'rejected'],
  default: 'none'
},
deletionRequestReason: String,
deletionRequestDate: Date,
deletionRejectionReason: String,
```

#### 2. Notification Model (`server/src/models/Notification.js`)
Added new notification types:
- `seller_deletion_requested` - When seller submits deletion request
- `seller_deletion_approved` - When admin approves deletion
- `seller_deletion_rejected` - When admin rejects deletion

#### 3. User Controller (`server/src/controllers/user.controller.js`)
Updated `confirmAccountDeletion()`:
- **Buyer flow**: Deletes immediately, notifies admins after deletion
- **Seller flow**: Creates pending request, notifies admins for approval

#### 4. Admin Controller (`server/src/controllers/admin.controller.js`)
Added three new endpoints:
- `getPendingSellerDeletions()` - Get all pending seller deletion requests
- `approveSellerDeletion(id)` - Approve and delete seller account
- `rejectSellerDeletion(id, reason)` - Reject deletion request with reason

#### 5. Admin Routes (`server/src/routes/admin.routes.js`)
```javascript
router.get("/sellers/deletions/pending", getPendingSellerDeletions);
router.post("/sellers/:id/deletions/approve", approveSellerDeletion);
router.post("/sellers/:id/deletions/reject", rejectSellerDeletion);
```

### Client Changes

#### 1. API Layer (`client/lib/api.ts`)
Added admin methods:
```typescript
getPendingSellerDeletions()
approveSellerDeletion(id)
rejectSellerDeletion(id, reason)
```

#### 2. Seller Settings (`client/app/dashboard/seller/page.tsx`)
Added "Delete Account" tab in settings modal:
- Send verification code
- Enter OTP + deletion reason
- Submit request for admin approval
- Shows success message: "Deletion request submitted! Admin will review it soon."

#### 3. Admin Seller Deletions Page (`client/app/dashboard/admin/seller-deletions/page.tsx`)
**New page**: `/dashboard/admin/seller-deletions`
- Lists all pending seller deletion requests
- Shows seller name, email, reason, and request date
- **Approve** button: Confirms and deletes seller account
- **Reject** button: Opens modal to enter rejection reason
- Notifications sent to seller on approve/reject

#### 4. Admin Notifications (`client/app/dashboard/admin/notifications/page.tsx`)
Enhanced with two deletion sections:
- **Buyer Account Deletions** (orange) - Completed deletions with reasons
- **Seller Deletion Requests** (yellow) - Pending requests with "Review Requests →" button

## Flow Diagrams

### Buyer Deletion Flow
```
Buyer → Settings → Delete Account → Send Code → Enter OTP + Reason
  → Confirm → Account Deleted Immediately → Redirect to Register
  → Admin receives notification with buyer's reason
```

### Seller Deletion Flow
```
Seller → Settings → Delete Account → Send Code → Enter OTP + Reason
  → Submit Request → Status: Pending Admin Approval
  → Admin receives notification

Admin → Notifications → Review Requests → Seller Deletions Page
  → Approve: Seller account deleted + seller notified
  → Reject: Seller receives rejection reason + can try again
```

## Test Users

Run to create test users:
```powershell
cd "c:\mini Desktop\Fullstack\contentSellify\server"
$env:MONGO_URI="mongodb://127.0.0.1:27017/contentsellify"
node scripts/createTestUsers.js
```

Created users:
- **Admin**: `admin.notify@test.local` / `Pass1234!`
- **Buyer**: `buyer.delete@test.local` / `Pass1234!`
- **Seller**: `seller.delete@test.local` / `Pass1234!` (approved)

## How to Test

### Test Seller Deletion Flow:
1. Start server and client
2. Login as seller: `seller.delete@test.local` / `Pass1234!`
3. Dashboard → Menu → Settings → Delete Account tab
4. Click "Send Verification Code"
5. Enter OTP from email + reason (e.g., "Testing seller deletion flow")
6. Click "Submit Deletion Request"
7. See success: "Deletion request submitted! Admin will review it soon."

### Test Admin Approval:
1. Login as admin: `admin.notify@test.local` / `Pass1234!`
2. Go to Notifications - see "Seller Deletion Requests" section
3. Click "Review Requests →" or go to `/dashboard/admin/seller-deletions`
4. See seller's request with reason
5. Click "✓ Approve" → Seller account deleted, seller notified
   OR
   Click "✕ Reject" → Enter reason → Seller notified with rejection reason

### Test Buyer Deletion (No Approval):
1. Login as buyer: `buyer.delete@test.local` / `Pass1234!`
2. Dashboard → Menu → Settings → Delete Account tab
3. Send code → Enter OTP + reason
4. Confirm → Account deleted immediately → Redirected to register
5. Admin can see deletion notification with buyer's reason

## Notifications Summary

### Admin Receives:
- `user_deleted` - When buyer deletes account (after deletion)
- `seller_deletion_requested` - When seller requests deletion (pending approval)

### Seller Receives:
- `seller_deletion_approved` - Account deletion approved
- `seller_deletion_rejected` - Account deletion rejected with reason

## Database Fields

### User Model - New Fields:
```javascript
// All users (buyer/seller)
deletionOTP: String
deletionOTPExpire: Date

// Sellers only
deletionRequestStatus: 'none' | 'pending' | 'approved' | 'rejected'
deletionRequestReason: String
deletionRequestDate: Date
deletionRejectionReason: String
```

## API Endpoints

### User Endpoints (Protected):
- `POST /api/users/request-account-deletion` - Send OTP
- `POST /api/users/confirm-account-deletion` - Verify OTP + submit request
  - Buyer: Deletes immediately
  - Seller: Creates pending request

### Admin Endpoints (Admin only):
- `GET /api/admin/sellers/deletions/pending` - Get pending requests
- `POST /api/admin/sellers/:id/deletions/approve` - Approve deletion
- `POST /api/admin/sellers/:id/deletions/reject` - Reject with reason

## Key Differences: Buyer vs Seller

| Feature | Buyer | Seller |
|---------|-------|--------|
| Admin approval required | ❌ No | ✅ Yes |
| Deletion timing | Immediate | After admin approval |
| Admin notification | After deletion | Before deletion (pending) |
| Can be rejected | ❌ No | ✅ Yes (with reason) |
| Redirect after request | To register page | Stays logged in (pending) |

## Success Messages

### Buyer:
- "Account deleted successfully" → Redirects to register

### Seller:
- "Deletion request submitted! Admin will review it soon." → Stays in dashboard

### Admin:
- "Seller account deletion approved"
- "Seller deletion request rejected"

## Notes
- OTP expiry: 10 minutes
- Minimum reason length: 3 characters
- Seller can see their pending status in notifications
- Admin can reject with detailed reason
- All deletion events are logged in notifications
- Related data (products, orders) are NOT cascaded in this implementation
