# Quick Start Guide - Trust & Security Features

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install pdf-parse canvas sharp axios
```

### 2. Configure Environment Variables
Add to `server/.env`:
```env
VIRUSTOTAL_API_KEY=your_api_key_here
```

Get your free VirusTotal API key at: https://www.virustotal.com/gui/join-us

### 3. Start Development Servers

#### Start Backend Server:
```bash
cd server
npm run dev
```

#### Start Frontend Server:
```bash
cd client
npm run dev
```

---

## Testing Workflow

### Test 1: Upload Product with Malware Scanning ✅

1. **Login as Seller**
   - Navigate to `/dashboard`
   - Upload a new product with a PDF file

2. **Check Scan Results**
   - Upload completes automatically
   - Backend logs will show: "VirusTotal scan result: clean/flagged"
   - Check MongoDB `products` collection for `malwareScanDetails` field

3. **Admin View**
   - Login as admin
   - Go to `/dashboard/admin/security`
   - Click "Malware Scans" tab
   - View scan statistics and flagged products

---

### Test 2: PDF Page Extraction ✅

1. **Upload PDF Product**
   - Upload a product with a PDF file
   - Previous: Page count estimated (filesize / 75000)
   - Now: Exact page count from PDF metadata

2. **Verify Accuracy**
   - Check product details page
   - Page count should match actual PDF pages
   - Check MongoDB `products` collection `pageCount` field

---

### Test 3: Review & Rating System ✅

#### As Buyer:
1. **Purchase a Product**
   - Complete a product purchase
   - Navigate to product detail page `/marketplace/:productId`

2. **Submit Review**
   - Scroll to "Customer Reviews" section
   - Click "Write a Review" button
   - Select star rating (1-5)
   - Enter review comment (max 1000 chars)
   - Submit review

3. **View Reviews**
   - See your review in the list
   - View rating distribution chart
   - See average rating update

#### As Seller:
1. **View Reviews**
   - Go to seller dashboard
   - See reviews on your products

2. **Respond to Review**
   - Click "Add Response" on a review
   - Enter seller response
   - Response appears below review with 💬 icon

---

### Test 4: Seller Profile Pages ✅

1. **Access Seller Profile**
   - Click seller name on any product
   - Or navigate to `/seller/:sellerId`

2. **View Profile Features**
   - ✅ Seller avatar and bio
   - ✅ Stats grid (total sales, products, rating, member since)
   - ✅ Products tab with product cards
   - ✅ Reviews tab with buyer reviews
   - ✅ Identity verified badge (if verified)

3. **Test Navigation**
   - Click product cards → Navigate to marketplace
   - Switch between Products and Reviews tabs
   - Check responsive design on mobile

---

### Test 5: Admin Security Dashboard ✅

1. **Access Dashboard**
   - Login as admin
   - Go to `/dashboard/admin`
   - Click "Trust & Security" card
   - Navigate to `/dashboard/admin/security`

2. **Malware Scans Tab**
   - View scan statistics
   - Check total scans, clean products, detections
   - View high threat products list
   - Click "View VirusTotal Report" for detailed analysis
   - Click "Manage Product" to edit/delete flagged products

3. **Content Review Tab**
   - View products flagged for manual review
   - See flags: "Low page count", "Small file", "Price anomaly"
   - View severity (high/medium/low)
   - Click "✅ Approve" to clear flags
   - Click "❌ Reject" to reject product (with reason)
   - Notification sent to seller on action

4. **Identity Verification Tab**
   - View sellers pending verification
   - See seller stats (sales, rating, member since)
   - Click "✅ Verify Identity" to approve
   - Enter verification notes (optional)
   - Seller receives notification
   - ✅ badge appears on seller profile

---

## API Endpoints Reference

### Review APIs:
```
POST   /api/reviews
GET    /api/reviews/product/:productId
PATCH  /api/reviews/:reviewId
DELETE /api/reviews/:reviewId
GET    /api/reviews/can-review/:productId/:orderId
POST   /api/reviews/:reviewId/response
```

### Seller Profile APIs:
```
GET    /api/sellers/:sellerId
GET    /api/sellers/:sellerId/products
GET    /api/sellers/:sellerId/reviews
PATCH  /api/sellers/profile
```

### Admin Security APIs:
```
GET    /api/admin/security/malware/flagged?severity=high
GET    /api/admin/security/malware/stats
GET    /api/admin/security/content-review/queue
POST   /api/admin/security/content-review/:id/resolve
GET    /api/admin/security/identity/pending
POST   /api/admin/security/identity/:sellerId/verify
```

---

## Troubleshooting

### VirusTotal API Issues:

**Problem:** "VirusTotal API key not configured"
- **Solution:** Add `VIRUSTOTAL_API_KEY` to `.env` file

**Problem:** Rate limit exceeded (429 error)
- **Solution:** Free tier = 4 requests/min. Wait 60 seconds or upgrade API plan
- **Fallback:** System automatically uses basic file validation

**Problem:** No scan results
- **Solution:** Check backend logs for errors. Verify API key is valid.

### PDF Extraction Issues:

**Problem:** "Cannot find module 'pdf-parse'"
- **Solution:** Run `npm install pdf-parse canvas sharp`

**Problem:** Page count still inaccurate
- **Solution:** Check if `extractPDFData()` is being called in `previewGenerator.js`
- **Check:** Backend logs should show "Extracted X pages from PDF"

### Review System Issues:

**Problem:** Can't submit review
- **Solution:** Must be a buyer who purchased the product
- **Check:** Call `/api/reviews/can-review/:productId/:orderId` endpoint

**Problem:** Reviews not showing
- **Solution:** Check MongoDB `reviews` collection
- **Verify:** Product ID is correct and reviews exist

### Admin Dashboard Issues:

**Problem:** Security dashboard blank
- **Solution:** Check browser console for API errors
- **Verify:** Admin authentication token is valid
- **Check:** Backend routes registered in `app.js`

**Problem:** 403 Forbidden errors
- **Solution:** Ensure user role is "admin"
- **Check:** JWT token has correct role claim

---

## Demo User Accounts

### Create Test Users:

#### Admin User:
```bash
# Register at /register
Role: Admin
Email: admin@test.com
Password: Admin@123
```

#### Seller User:
```bash
# Register at /register
Role: Seller
Email: seller@test.com
Password: Seller@123

# Wait for admin approval
# Admin approves at /dashboard/admin/sellers
```

#### Buyer User:
```bash
# Register at /register
Role: Buyer
Email: buyer@test.com
Password: Buyer@123
```

---

## Testing Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] MongoDB connected
- [ ] VirusTotal API key configured
- [ ] Can upload product with PDF
- [ ] Malware scan completes (check logs)
- [ ] PDF page count accurate
- [ ] Can purchase product as buyer
- [ ] Can submit review after purchase
- [ ] Review appears on product page
- [ ] Rating distribution chart displays
- [ ] Seller can add response to review
- [ ] Seller profile page loads
- [ ] Products and reviews tabs work
- [ ] Admin can access security dashboard
- [ ] Malware scan stats display
- [ ] Content review queue shows flagged products
- [ ] Can approve/reject flagged content
- [ ] Identity verification works
- [ ] Notifications sent on actions

---

## Expected Results

### After Product Upload:
```javascript
// MongoDB products collection
{
  title: "My Product",
  pageCount: 15,  // Real page count from PDF
  virusTotalId: "abc123-...",
  virusTotalLink: "https://www.virustotal.com/gui/file-analysis/abc123",
  malwareScanDetails: {
    detections: {
      malicious: 0,
      suspicious: 0,
      harmless: 75,
      undetected: 5
    },
    basicCheckOnly: false
  }
}
```

### After Review Submission:
```javascript
// MongoDB reviews collection
{
  productId: ObjectId("..."),
  buyerId: ObjectId("..."),
  rating: 5,
  comment: "Great product!",
  helpfulCount: 0,
  sellerResponse: {
    text: "Thank you for your review!",
    respondedAt: ISODate("2024-01-15")
  }
}

// User collection (seller) updated
{
  averageRating: 4.5,
  ratingCount: 10
}
```

### After Identity Verification:
```javascript
// MongoDB users collection (seller)
{
  identityVerified: true,
  identityVerifiedAt: ISODate("2024-01-15"),
  identityVerificationNotes: "ID verified via passport"
}
```

---

## Next Steps After Testing

1. **Deploy to Production**
   - Set production VirusTotal API key
   - Configure MongoDB production database
   - Update CORS settings

2. **Monitor Performance**
   - Track VirusTotal API usage
   - Monitor review submission rates
   - Check malware detection accuracy

3. **User Training**
   - Train admins on security dashboard
   - Create seller guide for responding to reviews
   - Educate buyers on review system

4. **Future Enhancements**
   - Email notifications for reviews
   - Review moderation queue
   - Identity document uploads
   - Review analytics dashboard
   - Automated malware response actions

---

## Support Resources

- **VirusTotal Documentation:** https://docs.virustotal.com/reference/overview
- **pdf-parse npm:** https://www.npmjs.com/package/pdf-parse
- **MongoDB Documentation:** https://docs.mongodb.com
- **Next.js Documentation:** https://nextjs.org/docs

---

## Success! 🎉

If you've completed all tests above, your ContentSellify marketplace now has:
- ✅ Enterprise-level malware protection
- ✅ Accurate PDF validation
- ✅ Complete review and rating system
- ✅ Public seller reputation pages
- ✅ Comprehensive admin security tools

Your platform is now **production-ready** with advanced trust and security features!
