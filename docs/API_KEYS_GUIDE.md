# Required API Keys & Configuration

## Environment Variables Needed

Add these to your `.env` file in the `server` directory:

```env
# ==============================================
# RAZORPAY (Payment Gateway - for receiving money)
# ==============================================
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# ==============================================
# RAZORPAYX (Payout System - for sending money)
# ==============================================
RAZORPAYX_KEY_ID=
RAZORPAYX_KEY_SECRET=
RAZORPAYX_ACCOUNT_NUMBER=

# ==============================================
# DATABASE
# ==============================================
MONGODB_URI=mongodb://localhost:27017/contentSellify

# ==============================================
# JWT & SECURITY
# ==============================================
JWT_SECRET=your_secret_key_here_minimum_32_characters
```

## How to Get These Keys

### 1. Razorpay (Payment Gateway)

**Purpose:** To receive payments from buyers

**Steps:**
1. Go to: https://dashboard.razorpay.com/signup
2. Sign up with your email
3. Complete basic verification
4. Navigate to: **Settings → API Keys**
5. Click **Generate Test Key** (or Live Key for production)
6. Copy both:
   - Key ID (starts with `rzp_test_`)
   - Key Secret (hidden, click to reveal)

7. For Webhook Secret:
   - Go to: **Settings → Webhooks**
   - Click **Create New Webhook**
   - Webhook URL: `https://yourdomain.com/api/webhook/razorpay`
   - Select Events: **payment.captured**
   - Copy the **Webhook Secret**

**Paste in .env:**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

### 2. RazorpayX (Payout System)

**Purpose:** To pay sellers their earnings (90% of sale price)

**Important:** RazorpayX requires business KYC and may take 1-2 business days for approval

**Steps:**
1. Go to: https://x.razorpay.com/
2. Sign up (use same email as Razorpay for easier management)
3. Complete **Business KYC Verification:**
   - Business details
   - PAN card
   - Business documents
   - Bank statements

4. After approval, navigate to: **Settings → API Keys**
5. Click **Generate API Key** in the RazorpayX section
6. Copy both:
   - Key ID (starts with `rzpx_test_`)
   - Key Secret

7. Get Account Number:
   - Go to: **Current Account** or **Banking** section
   - Copy your **Virtual Account Number**

**Paste in .env:**
```env
RAZORPAYX_KEY_ID=rzpx_test_xxxxxxxxxxxxx
RAZORPAYX_KEY_SECRET=xxxxxxxxxxxxx
RAZORPAYX_ACCOUNT_NUMBER=2223330xxxxxxxx
```

---

## Test Mode vs Live Mode

| Mode | When to Use | Key Prefix |
|------|-------------|------------|
| **Test** | Development & Testing | `rzp_test_`, `rzpx_test_` |
| **Live** | Production (Real money) | `rzp_live_`, `rzpx_live_` |

---

## Testing Without RazorpayX (Quick Start)

If you don't want to wait for RazorpayX KYC approval, you can test partial functionality:

**Option 1: Mock Testing**
- Comment out RazorpayX API calls in bank controller
- Use dummy data to test UI and flow
- Add real keys later

**Option 2: Use Razorpay Sandbox**
- Razorpay provides sandbox environment
- Limited payout testing available

---

## Minimum Viable Configuration

If you want to start quickly, you need AT MINIMUM:

```env
# For basic payment receiving
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx

# For database
MONGODB_URI=mongodb://localhost:27017/contentSellify

# For authentication
JWT_SECRET=your_very_long_and_secure_secret_key_here
```

You can add RazorpayX keys later when ready for payout testing.

---

## Security Best Practices

1. **Never commit API keys to Git:**
   ```bash
   # .gitignore should include:
   .env
   .env.local
   .env.production
   ```

2. **Use different keys for test and production**

3. **Rotate keys periodically** (every 6 months)

4. **Store production keys in secure secret managers:**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault
   - Environment variables on hosting platform

5. **Restrict API key permissions** in Razorpay dashboard

---

## Verification Checklist

After adding keys, verify they work:

```bash
# In server directory
npm install

# Start server
npm run dev

# Test endpoints:
# 1. Add bank account (requires auth)
# 2. Create test order
# 3. Check Razorpay dashboard for payment
# 4. Test payout (once RazorpayX is configured)
```

---

## Support Resources

| Resource | URL |
|----------|-----|
| Razorpay Docs | https://razorpay.com/docs/ |
| RazorpayX Docs | https://razorpay.com/docs/razorpayx/ |
| Support Email | support@razorpay.com |
| Razorpay Dashboard | https://dashboard.razorpay.com/ |
| RazorpayX Dashboard | https://x.razorpay.com/ |

---

## Common Issues & Solutions

### "Invalid API Key"
- Check if key is copied correctly (no extra spaces)
- Verify key is for correct mode (test vs live)
- Ensure key is active in dashboard

### "Webhook signature validation failed"
- Verify webhook secret is correct
- Check if webhook URL is publicly accessible
- Ensure request body is not modified

### "RazorpayX account not found"
- Complete KYC verification
- Check if account is activated
- Verify account number is correct

### "Insufficient balance"
- Add funds to RazorpayX account
- In test mode, use test balance (usually unlimited)

---

## Need Help Setting This Up?

1. **Razorpay Setup Issues:** Contact support@razorpay.com
2. **RazorpayX KYC Issues:** Use live chat on x.razorpay.com
3. **Integration Issues:** Check the main documentation in `BANK_ACCOUNT_SETUP.md`

---

## Quick Start Command

```bash
# 1. Copy the template
cp .env.example .env

# 2. Edit .env and add your keys
nano .env  # or use your preferred editor

# 3. Install dependencies
cd server
npm install

# 4. Start development server
npm run dev
```

---

**Remember:** Keep your API keys secure and never share them publicly!
