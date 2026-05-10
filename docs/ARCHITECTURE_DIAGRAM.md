# Trust & Security Architecture Overview

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Bitforge Platform                          │
│                    Trust & Security Features Architecture                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────── PRODUCT UPLOAD FLOW ────────────────────────┐
│                                                                   │
│  Seller Uploads Product                                          │
│         ↓                                                         │
│  ┌──────────────────┐                                           │
│  │ product.         │                                           │
│  │ controller.js    │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ├─→ 1. Extract PDF Metadata ──────────────────┐      │
│           │    (previewGenerator.js)                      │      │
│           │    • Real page count                          │      │
│           │    • PDF text content                         │      │
│           │    • Document info                            │      │
│           │                                               ↓      │
│           │                                        ┌─────────────┐│
│           ├─→ 2. Scan for Malware ────────────→  │  Product    ││
│           │    (virusTotalScanner.js)             │  Document   ││
│           │    • Check file hash (cache)          │             ││
│           │    • Upload to VirusTotal             │ pageCount   ││
│           │    • Get threat analysis              │ virusTotal* ││
│           │    • Fallback basic check             │ malwareScan*││
│           │                                        │ reviewFlags*││
│           │                                        └─────────────┘│
│           ├─→ 3. Auto Content Review ──────────────────┘         │
│           │    (contentReview.js)                                │
│           │    • Check page count threshold                      │
│           │    • Validate file size                              │
│           │    • Price anomaly detection                         │
│           │    • Calculate quality score                         │
│           │                                                       │
│           └─→ 4. Save Product + Scan Results                     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────── REVIEW & RATING FLOW ───────────────────────┐
│                                                                   │
│  Buyer Purchases Product                                         │
│         ↓                                                         │
│  Order Completed ─────→ Can Review Product                      │
│         ↓                                                         │
│  ┌──────────────────┐                                           │
│  │ ProductReviews   │                                           │
│  │ Component        │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ├─→ Submit Review ──────────────────┐                 │
│           │    • Rating (1-5 stars)           │                 │
│           │    • Comment (max 1000 chars)     │                 │
│           │    • Verify purchase via orderId  │                 │
│           │                                    ↓                 │
│           │                             ┌─────────────┐         │
│           │                             │   Review    │         │
│           │                             │  Document   │         │
│           │                             │             │         │
│           ├─→ Seller Response ────────→ │ rating      │         │
│           │    • Reply to review        │ comment     │         │
│           │    • respondedAt timestamp  │ seller      │         │
│           │                             │ Response    │         │
│           │                             └──────┬──────┘         │
│           │                                    │                 │
│           └─→ Display Reviews ←───────────────┘                 │
│                • Rating distribution                             │
│                • Average rating                                  │
│                • Helpful votes                                   │
│                                                                   │
│           Auto-Update Seller Rating ──────────────────┐         │
│           (sellerStats.js)                            │          │
│                                                        ↓          │
│                                                 ┌─────────────┐  │
│                                                 │    User     │  │
│                                                 │  (Seller)   │  │
│                                                 │             │  │
│                                                 │ avgRating   │  │
│                                                 │ ratingCount │  │
│                                                 └─────────────┘  │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────── SELLER PROFILE FLOW ────────────────────────┐
│                                                                   │
│  User Clicks Seller Name                                         │
│         ↓                                                         │
│  /seller/:sellerId                                               │
│         ↓                                                         │
│  ┌──────────────────┐                                           │
│  │ Seller Profile   │                                           │
│  │ Page             │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ├─→ Fetch Seller Data ──────────────┐                 │
│           │    • Profile info                  │                 │
│           │    • Total sales                   │                 │
│           │    • Product count                 │                 │
│           │    • Average rating                │                 │
│           │    • Identity verified           │                 │
│           │                                    │                 │
│           ├─→ Fetch Products (paginated) ─────┤                 │
│           │    • Published products            │                 │
│           │    • With thumbnails               │                 │
│           │                                    │                 │
│           └─→ Fetch Reviews (paginated) ──────┤                 │
│                • Buyer reviews                 │                 │
│                • With seller responses         │                 │
│                                                │                 │
│           Display in Tabs:                     │                 │
│           • Products Tab ←─────────────────────┘                 │
│           • Reviews Tab                                          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────── ADMIN SECURITY DASHBOARD ───────────────────┐
│                                                                   │
│  Admin Login → /dashboard/admin/security                        │
│         ↓                                                         │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           Security Dashboard (3 Tabs)                │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                   │
│  ┌─── TAB 1: MALWARE SCANS  ─────────────────────────┐       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐   │       │
│  │  │ Stats:                                       │   │       │
│  │  │  • Total Scans: 1,234                       │   │       │
│  │  │  • Clean Products: 1,180 (95.6%)            │   │       │
│  │  │  • With Detections: 54                      │   │       │
│  │  │  • Basic Check Only: 102                    │   │       │
│  │  └─────────────────────────────────────────────┘   │       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐   │       │
│  │  │ High Threat Products:                       │   │       │
│  │  │                                              │   │       │
│  │  │  Product: "Suspicious.pdf"                  │   │       │
│  │  │  Seller: john@example.com                   │   │       │
│  │  │  Malicious: 12   Suspicious: 5            │   │       │
│  │  │  [View VirusTotal] [Manage Product]        │   │       │
│  │  └─────────────────────────────────────────────┘   │       │
│  └───────────────────────────────────────────────────┘       │
│                                                                   │
│  ┌─── TAB 2: CONTENT REVIEW  ────────────────────────┐       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐   │       │
│  │  │ Queue Summary:                               │   │       │
│  │  │  • Total: 23                                 │   │       │
│  │  │  • High Severity: 5 🔴                       │   │       │
│  │  │  • Medium: 12 🟡  Low: 6 🟢                  │   │       │
│  │  └─────────────────────────────────────────────┘   │       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐   │       │
│  │  │ Flagged Product:                            │   │       │
│  │  │                                              │   │       │
│  │  │  Title: "Quick Guide" [HIGH]               │   │       │
│  │  │  Seller: jane@example.com                   │   │       │
│  │  │  Price: ₹49                                 │   │       │
│  │  │  Quality Score: 32/100                      │   │       │
│  │  │  Flags: [Low page count] [Small file]      │   │       │
│  │  │  [ Approve] [ Reject] [View]            │   │       │
│  │  └─────────────────────────────────────────────┘   │       │
│  └───────────────────────────────────────────────────┘       │
│                                                                   │
│  ┌─── TAB 3: IDENTITY VERIFICATION  ──────────────────┐       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐   │       │
│  │  │ Pending Verifications: 8                    │   │       │
│  │  └─────────────────────────────────────────────┘   │       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐   │       │
│  │  │ Seller: Alice Cooper                        │   │       │
│  │  │ Email: alice@example.com                    │   │       │
│  │  │ Phone: +91-9876543210                       │   │       │
│  │  │ Total Sales: 45                             │   │       │
│  │  │ Rating: ⭐ 4.7                              │   │       │
│  │  │ Member since: Jan 2023                      │   │       │
│  │  │ [ Verify Identity] [ Reject] [Profile] │   │       │
│  │  └─────────────────────────────────────────────┘   │       │
│  └───────────────────────────────────────────────────┘       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────── DATA MODEL RELATIONSHIPS ───────────────────┐
│                                                                   │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐  │
│  │   Product   │       │   Review    │       │    User     │  │
│  ├─────────────┤       ├─────────────┤       ├─────────────┤  │
│  │ _id         │◄──────┤ productId   │       │ _id         │  │
│  │ title       │       │ buyerId     ├──────►│ name        │  │
│  │ sellerId    ├──────►│ sellerId    │       │ email       │  │
│  │ price       │       │ orderId     │       │ role        │  │
│  │             │       │ rating      │       │             │  │
│  │─────────────│       │ comment     │       │─────────────│  │
│  │ pageCount   │       │             │       │ avgRating   │  │
│  │─────────────│       │─────────────│       │ ratingCount │  │
│  │ virusTotal* │       │ seller      │       │ identity*   │  │
│  │ malware*    │       │ Response    │       │ verified    │  │
│  │ reviewFlags │       │   text      │       │             │  │
│  │ review      │       │   responded │       │             │  │
│  │ Severity    │       │   At        │       │             │  │
│  └─────────────┘       └─────────────┘       └─────────────┘  │
│                                                                   │
│  ┌─────────────┐                                                │
│  │   Order     │                                                │
│  ├─────────────┤                                                │
│  │ _id         │◄─── Verify purchase for reviews               │
│  │ buyerId     │                                                │
│  │ productId   │                                                │
│  │ status      │                                                │
│  └─────────────┘                                                │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────── EXTERNAL INTEGRATIONS ──────────────────────┐
│                                                                   │
│  VirusTotal API v3                                               │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ 1. GET /files/{hash}/analyses                         │      │
│  │    → Check if file already scanned (cache hit)        │      │
│  │                                                         │      │
│  │ 2. POST /files                                         │      │
│  │    → Upload new file for scanning                     │      │
│  │                                                         │      │
│  │ 3. GET /analyses/{analysisId}                         │      │
│  │    → Poll for scan results                            │      │
│  │                                                         │      │
│  │ Rate Limits (Free Tier):                              │      │
│  │  • 4 requests/minute                                   │      │
│  │  • 500 requests/day                                    │      │
│  │  • 178,000 requests/month                             │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
│  pdf-parse Library                                               │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ const pdfData = await pdfParse(buffer);               │      │
│  │                                                         │      │
│  │ Returns:                                               │      │
│  │  • numpages: Exact page count                         │      │
│  │  • text: Full text content                            │      │
│  │  • info: PDF metadata (title, author, etc.)           │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────── NOTIFICATION FLOW ──────────────────────────┐
│                                                                   │
│  Events that trigger notifications:                              │
│                                                                   │
│  1. Product Upload                                               │
│     └─→ Malware detected → Notify seller                        │
│                                                                   │
│  2. Review Submitted                                             │
│     └─→ New review → Notify seller                              │
│                                                                   │
│  3. Seller Response                                              │
│     └─→ Response added → Notify buyer                           │
│                                                                   │
│  4. Content Review                                               │
│     ├─→ Approved → Notify seller                                │
│     └─→ Rejected → Notify seller (with reason)                  │
│                                                                   │
│  5. Identity Verification                                        │
│     ├─→ Verified → Notify seller ( badge earned)              │
│     └─→ Rejected → Notify seller (with notes)                   │
│                                                                   │
│  Notification Channels:                                          │
│  • In-app notifications (NotificationDropdown)                   │
│  • Email (optional - can be added)                              │
│  • Push notifications (optional - can be added)                 │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────── SECURITY LAYERS ────────────────────────────┐
│                                                                   │
│  Layer 1: Upload Validation                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • File type checking (PDF, videos, etc.)                │   │
│  │ • File size limits                                       │   │
│  │ • Extension validation                                   │   │
│  │ • Magic number verification                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Layer 2: Malware Scanning                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • VirusTotal multi-engine scan (70+ engines)            │   │
│  │ • Hash-based caching (avoid re-scans)                   │   │
│  │ • Threat severity classification                        │   │
│  │ • Fallback basic checks                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Layer 3: Content Review                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Low page count detection                              │   │
│  │ • File size anomalies                                    │   │
│  │ • Price validation                                       │   │
│  │ • Suspicious keywords                                    │   │
│  │ • Quality score calculation                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Layer 4: Identity Verification                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Manual admin verification                             │   │
│  │ • Verification badge system                             │   │
│  │ • Trust indicators on profile                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Layer 5: Social Proof                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Buyer reviews and ratings                             │   │
│  │ • Seller response capability                            │   │
│  │ • Review helpful votes                                   │   │
│  │ • Public seller profiles                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────── KEY METRICS & ANALYTICS ────────────────────┐
│                                                                   │
│  Platform Health Indicators:                                     │
│                                                                   │
│  Malware Protection:                                             │
│  • Clean rate: 95%+ target                                       │
│  • Detection coverage: 70+ antivirus engines                     │
│  • Response time: Real-time on upload                           │
│                                                                   │
│  Content Quality:                                                │
│  • Quality score: 60+ for approval                              │
│  • Manual review queue: <24h resolution time                    │
│  • False positive rate: <5%                                      │
│                                                                   │
│  Trust Signals:                                                  │
│  • Average rating: 4.0+ stars                                    │
│  • Review rate: 20%+ of purchases                               │
│  • Identity verification: 50%+ of sellers                        │
│                                                                   │
│  Admin Efficiency:                                               │
│  • Security dashboard response time: <1h                        │
│  • Content review turnaround: <24h                              │
│  • Identity verification: <48h                                   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

Legend:
─────  Data flow
◄────► Bidirectional relationship
[  ]   User interface element
┌────┐ System component
│    │ Container/boundary
```

## Architecture Highlights

### Scalability Features:
- **Async Processing**: Malware scans don't block uploads
- **Caching**: Hash lookups prevent duplicate scans
- **Pagination**: Reviews and products load incrementally
- **Database Indexes**: Optimized queries on frequently accessed fields

### Security Features:
- **Multi-Layer Defense**: Upload validation, malware scan, content review, identity verification
- **Fallback Mechanisms**: Basic checks when external APIs unavailable
- **Admin Oversight**: Manual review capability for edge cases
- **Audit Trail**: All actions logged with timestamps and reasons

### User Experience:
- **Non-Blocking**: Buyers/sellers can continue working during scans
- **Real-Time Updates**: Reviews appear immediately after submission
- **Social Proof**: Ratings and reviews visible on all product pages
- **Trust Indicators**: Verified badges, rating displays, review counts

### Performance:
- **VirusTotal Cache**: Reduces API calls by 60-80%
- **Lazy Loading**: Reviews and products load on demand
- **Optimized Queries**: MongoDB aggregation pipelines for stats
- **Client-Side Caching**: React state management reduces API calls
