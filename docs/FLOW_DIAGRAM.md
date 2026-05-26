# Money Flow Diagram 💰

## Complete Payment & Payout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTENTSTELLIFY PLATFORM                     │
│                                                                  │
│  ┌────────────┐         ┌────────────┐         ┌─────────────┐ │
│  │   BUYER    │         │   ADMIN    │         │   SELLER    │ │
│  │  (User)    │         │ (Platform) │         │  (Creator)  │ │
│  └────────────┘         └────────────┘         └─────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
STEP 1: Product Creation
═══════════════════════════════════════════════════════════════════

 SELLER                  ADMIN                 DATABASE
   │                       │                       │
   │  Creates Product      │                       │
   ├──────────────────────►│                       │
   │  (Price: ₹1000)       │                       │
   │                       │  Stores Product       │
   │                       ├──────────────────────►│
   │                       │  Status: "pending"    │
   │                       │                       │
   │                       │  Approves Product     │
   │                       ├──────────────────────►│
   │                       │  Status: "approved"   │
   │     ✓ Approved        │                       │
   │◄──────────────────────┤                       │


═══════════════════════════════════════════════════════════════════
STEP 2: Purchase & Payment (User pays admin)
═══════════════════════════════════════════════════════════════════

 BUYER                  RAZORPAY              DATABASE
   │                       │                       │
   │  Buy Product          │                       │
   │  ₹1000                │                       │
   ├──────────────────────►│                       │
   │                       │                       │
   │  Razorpay Checkout    │                       │
   │◄──────────────────────┤                       │
   │                       │                       │
   │  Enter Card Details   │                       │
   ├──────────────────────►│                       │
   │                       │                       │
   │   Payment Success     │                       │
   │◄──────────────────────┤                       │
   │                       │  Webhook              │
   │                       ├──────────────────────►│
   │                       │  payment.captured     │
   │                       │                       │

Order Created in Database:
┌────────────────────────────┐
│ buyerId: user123           │
│ sellerId: seller456        │
│ productId: prod789         │
│ amount: 1000 ₹             │
│ platformFee: 100 ₹ (10%)   │  ← Admin Commission
│ sellerAmount: 900 ₹ (90%)  │  ← Seller Payment
│ status: "paid"             │
│ razorpayPaymentId: xxx     │
└────────────────────────────┘


═══════════════════════════════════════════════════════════════════
STEP 3: Commission Split (Automatic)
═══════════════════════════════════════════════════════════════════

    ADMIN ACCOUNT (Razorpay)
    Receives: ₹1000
           │
           ├──── 10% ────► Admin Commission: ₹100
           │                (Kept in Admin Account)
           │
           └──── 90% ────► Seller Payment: ₹900
                            (Marked for payout)


═══════════════════════════════════════════════════════════════════
STEP 4: Seller Requests Withdrawal
═══════════════════════════════════════════════════════════════════

 SELLER                  DATABASE              ADMIN
   │                       │                       │
   │  Request Withdrawal   │                       │
   │  Amount: ₹900         │                       │
   ├──────────────────────►│                       │
   │                       │                       │
   │                       │  Create Payout        │
   │                       ├──────────────────────►│
   │                       │  Status: "pending"    │
   │  Request Submitted    │                       │
   │◄──────────────────────┤                       │
   │                       │  Notification         │
   │                       ├──────────────────────►│
   │                       │  "New withdrawal"     │

Payout Created in Database:
┌────────────────────────────┐
│ sellerId: seller456        │
│ amount: 900 ₹              │
│ status: "pending"          │
│ razorpayPayoutId: null     │
└────────────────────────────┘


═══════════════════════════════════════════════════════════════════
STEP 5: Admin Approves Payout (Admin pays seller)
═══════════════════════════════════════════════════════════════════

 ADMIN                   RAZORPAYX            SELLER BANK
   │                       │                       │
   │  Approve Payout       │                       │
   ├──────────────────────►│                       │
   │                       │  Create Payout        │
   │                       │  ₹900                 │
   │                       ├──────────────────────►│
   │                       │  (IMPS/NEFT/RTGS)     │
   │  Payout Initiated     │                       │
   │◄──────────────────────┤                       │
   │                       │  Payment Processed    │
   │                       ├──────────────────────►│
   │                       │  Success              │
   │                       │                       │
   │  Webhook              │                       │
   │◄──────────────────────┤                       │
   │  payout.processed     │                       │

Payout Updated in Database:
┌────────────────────────────┐
│ sellerId: seller456        │
│ amount: 900 ₹              │
│ status: "paid"             │
│ razorpayPayoutId: pout_xyz │
└────────────────────────────┘


═══════════════════════════════════════════════════════════════════
SUMMARY: Money Movement
═══════════════════════════════════════════════════════════════════

    Buyer Pays ₹1000
           │
           ▼
    ┌──────────────────┐
    │  ADMIN ACCOUNT   │  ← Money comes in via Razorpay
    │   (Razorpay)     │
    └──────────────────┘
           │
           ├─ Keeps: ₹100 (10% commission)
           │
           └─ Pays out: ₹900
                  │
                  ▼
    ┌──────────────────┐
    │ SELLER ACCOUNT   │  ← Money goes out via RazorpayX
    │  (Bank Account)  │
    └──────────────────┘


═══════════════════════════════════════════════════════════════════
BANK ACCOUNT SETUP FLOW
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│ SELLER ADDS BANK ACCOUNT                                     │
└─────────────────────────────────────────────────────────────┘

 SELLER                  RAZORPAYX             DATABASE
   │                       │                       │
   │  Add Bank Account     │                       │
   │  - Name               │                       │
   │  - Account Number     │                       │
   │  - IFSC Code          │                       │
   ├──────────────────────►│                       │
   │                       │  1. Create Contact    │
   │                       │  2. Create Fund Acc   │
   │                       │  3. Verify Account    │
   │                       │                       │
   │  Account Verified     │  Save Details         │
   │◄──────────────────────┼──────────────────────►│
   │                       │  - contactId          │
   │                       │  - fundAccountId      │
   │                       │  - bank details       │

User Record in Database:
┌────────────────────────────────────────────┐
│ bankAccount: {                             │
│   accountHolderName: "John Seller"         │
│   accountNumber: "1234567890"              │
│   ifscCode: "SBIN0007105"                  │
│   bankName: "State Bank of India"          │
│   isVerified: true                         │
│ }                                          │
│ razorpayContactId: "cont_xxxxx"            │
│ razorpayFundAccountId: "fa_xxxxx"          │
└────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│ ADMIN ADDS BANK ACCOUNT (Same Process)                       │
└─────────────────────────────────────────────────────────────┘

- Admin account receives all payments from buyers
- Commission (10%) is kept in admin account
- Remaining amount (90%) paid out to sellers


═══════════════════════════════════════════════════════════════════
FINANCIAL TRACKING
═══════════════════════════════════════════════════════════════════

ADMIN DASHBOARD STATISTICS:
┌────────────────────────────────────────────┐
│ Total Commission Earned:     ₹10,000       │
│ Total Payouts Made:          ₹8,000        │
│ Net Balance:                 ₹2,000        │
└────────────────────────────────────────────┘

SELLER DASHBOARD STATISTICS:
┌────────────────────────────────────────────┐
│ Total Earnings:              ₹9,000        │
│ Withdrawn:                   ₹5,000        │
│ Available Balance:           ₹4,000        │
└────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
TECHNOLOGY STACK
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                          FRONTEND                            │
│  Next.js 14 + TypeScript + TailwindCSS                      │
│  - Bank Account Forms                                        │
│  - Payment UI                                                │
│  - Dashboard Statistics                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          BACKEND                             │
│  Node.js + Express + MongoDB                                │
│  - Bank Account Management API                              │
│  - Payment Processing                                        │
│  - Payout Management                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│       RAZORPAY           │  │       RAZORPAYX          │
│  Payment Gateway         │  │  Payout System           │
│  - Receive Payments      │  │  - Send Payouts          │
│  - Webhooks              │  │  - Bank Verification     │
└──────────────────────────┘  └──────────────────────────┘


═══════════════════════════════════════════════════════════════════
KEY FEATURES
═══════════════════════════════════════════════════════════════════

 Automatic 10% commission split
 Secure bank account storage
 RazorpayX integration for payouts
 Real-time payment tracking
 Admin approval workflow
 Withdrawal request system
 Masked account numbers for security
 IFSC code validation
 Multiple payment modes (IMPS/NEFT/RTGS)
 Comprehensive dashboard statistics
 Webhook handling for automation
 Error handling and validation
 Role-based access control


═══════════════════════════════════════════════════════════════════
                     IMPLEMENTATION COMPLETE! 🎉
═══════════════════════════════════════════════════════════════════
```
