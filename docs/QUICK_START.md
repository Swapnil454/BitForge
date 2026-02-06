# Quick Setup Checklist ✅

## Step 1: Sign Up for Services (15 minutes)

### Razorpay (Required - No waiting)
- [ ] Go to: https://dashboard.razorpay.com/signup
- [ ] Sign up with email
- [ ] Verify email
- [ ] Navigate to: Settings → API Keys
- [ ] Generate Test Key
- [ ] Copy `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- [ ] Go to: Settings → Webhooks
- [ ] Create webhook for `payment.captured` event
- [ ] Copy `RAZORPAY_WEBHOOK_SECRET`

### RazorpayX (Optional - Takes 1-2 days for KYC)
- [ ] Go to: https://x.razorpay.com/
- [ ] Sign up (use same email as Razorpay)
- [ ] Submit KYC documents (Business details, PAN, etc.)
- [ ] Wait for approval (1-2 business days)
- [ ] After approval: Settings → API Keys
- [ ] Copy `RAZORPAYX_KEY_ID` and `RAZORPAYX_KEY_SECRET`
- [ ] Copy `RAZORPAYX_ACCOUNT_NUMBER` from Banking section

---

## Step 2: Setup Environment (5 minutes)

```bash
# Navigate to server directory
cd server

# Copy environment template
cp .env.example .env

# Edit the file
nano .env  # or use VS Code: code .env
```

**Minimum Required Variables:**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
MONGODB_URI=mongodb://localhost:27017/contentSellify
JWT_SECRET=your_secure_random_32_character_string
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3: Install Dependencies (3 minutes)

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

---

## Step 4: Start Development Servers (1 minute)

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

---

## Step 5: Test the Implementation (10 minutes)

### Test as Seller:
1. [ ] Register as seller
2. [ ] Wait for admin approval
3. [ ] Login to seller dashboard
4. [ ] Navigate to: `/dashboard/seller/bank-account`
5. [ ] Add bank account details
6. [ ] Verify details are saved

### Test as Admin:
1. [ ] Register as admin (or change role in database)
2. [ ] Login to admin dashboard  
3. [ ] Navigate to: `/dashboard/admin/bank-account`
4. [ ] Add admin bank account
5. [ ] View commission statistics
6. [ ] Navigate to: `/api/admin/sellers/bank-accounts`
7. [ ] View all sellers' bank accounts

### Test Payment Flow:
1. [ ] Create a test product (seller)
2. [ ] Admin approves product
3. [ ] Buyer purchases product
4. [ ] Payment captured (check Razorpay dashboard)
5. [ ] Order shows correct commission split
6. [ ] Seller requests withdrawal
7. [ ] Admin approves payout (requires RazorpayX)

---

## Database Schema Applied ✅

All necessary schema changes have been made:
- ✅ User model updated with bankAccount fields
- ✅ RazorpayX integration fields added
- ✅ Order model has commission calculation
- ✅ Payout model configured

---

## API Endpoints Available ✅

**Bank Management:**
- POST `/api/bank/add`
- GET `/api/bank`
- PUT `/api/bank/update`
- DELETE `/api/bank/delete`

**Admin:**
- GET `/api/admin/sellers/bank-accounts`
- GET `/api/admin/sellers/:sellerId/bank-account`
- GET `/api/admin/bank-stats`

**Payments (existing):**
- POST `/api/payment/create-order`
- GET `/api/payment/my-orders`
- POST `/api/webhook/razorpay`

**Payouts (existing):**
- POST `/api/seller/request-withdrawal`
- GET `/api/admin/payouts/pending`
- POST `/api/admin/payouts/:id/approve`

---

## Frontend Pages Created ✅

**Seller:**
- `/dashboard/seller/bank-account` ✅

**Admin:**
- `/dashboard/admin/bank-account` ✅

**Buyer:**
- Uses existing marketplace and checkout pages ✅

---

## What Works Without RazorpayX

**Working immediately:**
- ✅ User registration and authentication
- ✅ Bank account form (add/edit/delete)
- ✅ Bank details storage in database
- ✅ Payment receiving via Razorpay
- ✅ Commission calculation (10%)
- ✅ Order tracking
- ✅ Withdrawal requests
- ✅ Admin dashboard statistics

**Requires RazorpayX (after KYC):**
- ❌ Actual payouts to sellers
- ❌ RazorpayX fund account creation
- ❌ Bank account verification via RazorpayX

---

## Testing Data

### Test Bank Account:
```
Account Holder: John Doe
Account Number: 1234567890
IFSC Code: SBIN0007105
Bank Name: State Bank of India
Account Type: savings
```

### Test Razorpay Card:
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: 123
```

---

## Common Issues & Quick Fixes

### Server won't start
```bash
# Check if port 5000 is in use
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill process or change PORT in .env
PORT=5001
```

### MongoDB connection error
```bash
# Make sure MongoDB is running
mongod  # Start MongoDB

# Or use MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS errors
```env
# Update CLIENT_URL in .env
CLIENT_URL=http://localhost:3000
```

---

## Production Deployment Checklist

Before going live:
- [ ] Switch to Live API keys
- [ ] Update webhook URLs
- [ ] Enable HTTPS
- [ ] Set up secure secret management
- [ ] Configure production MongoDB
- [ ] Set up error monitoring
- [ ] Enable rate limiting
- [ ] Backup database regularly
- [ ] Test payout flow thoroughly
- [ ] Verify tax compliance

---

## Support & Documentation

| Resource | Link |
|----------|------|
| Full Implementation Guide | `BANK_ACCOUNT_SETUP.md` |
| API Keys Guide | `API_KEYS_GUIDE.md` |
| Summary | `IMPLEMENTATION_SUMMARY.md` |
| Razorpay Docs | https://razorpay.com/docs/ |
| RazorpayX Docs | https://razorpay.com/docs/razorpayx/ |

---

## Success Criteria ✅

Your implementation is complete when:
- ✅ Sellers can add bank accounts
- ✅ Admin can add bank account
- ✅ Payments are received (Razorpay)
- ✅ 10% commission is calculated correctly
- ✅ Admin can view statistics
- ✅ Withdrawal requests can be created
- ✅ Payouts work (after RazorpayX setup)

---

## Next Steps

1. **Immediate (< 1 hour):**
   - Sign up for Razorpay
   - Add Razorpay keys to .env
   - Test payment receiving

2. **Within 24 hours:**
   - Sign up for RazorpayX
   - Submit KYC documents
   - Test complete flow

3. **After RazorpayX approval:**
   - Add RazorpayX keys
   - Test payout functionality
   - Do end-to-end testing

4. **Before production:**
   - Switch to live keys
   - Set up monitoring
   - Configure backups
   - Review security

---

**Estimated Time to Full Setup:**
- Without RazorpayX: 30 minutes
- With RazorpayX: 1-2 business days (KYC approval time)

**Everything is ready to use! Just add your API keys and start testing.** 🚀
