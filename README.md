# BitForge | Digital Product Marketplace

**Live At:** [www.bittforge.in](https://www.bittforge.in)

BitForge is a comprehensive, state-of-the-art digital product marketplace built for creators, developers, and entrepreneurs. It provides a secure, high-performance platform for buying, selling, and managing digital content such as software, templates, courses, eBooks, and design assets.

---

## Core Features

### Marketplace & Shopping
- **Digital Product Discovery**: Advanced search, filtering, and category browsing for exploring digital goods.
- **Cart & Wishlist System**: Persistent shopping cart and wishlist functionality.
- **Instant Digital Delivery**: Secure, automated access to digital files immediately after purchase.

### Security & Moderation
- **VirusTotal Integration**: Automated malware scanning for all digital product uploads to guarantee buyer safety.
- **Role-Based Access Control**: Distinct, secure dashboards and permissions for **Buyers**, **Sellers**, and **Admins**.
- **Secure File Storage**: Leveraging Cloudflare R2 for highly secure digital product files and Cloudinary for blazing-fast image assets.

### Payments & Earnings
- **Seamless Checkout**: Fully integrated Razorpay checkout supporting a wide variety of payment methods.
- **Seller Earnings Wallet**: Real-time tracking of sales, platform fees, pending funds, and total withdrawable revenue.
- **Automated Payout Requests**: Sellers can request withdrawals with an intuitive Framer Motion modal UI, triggering automated admin email notifications.

### Progressive Web App (PWA)
- **App Installation**: Users can install BitForge directly to their Mobile or Desktop home screens (Standalone Mode).
- **Offline Fallback**: Custom offline UI and intelligent caching strategies for lightning-fast repeat visits.
- **App Shortcuts**: Quick launch actions ("Shop", "Sell") accessible instantly from the installed app icon.

### Real-Time Notifications & Emails
- **Web Push Notifications**: Firebase Cloud Messaging (FCM) deeply integrated into the custom PWA Service Worker.
- **Live In-App Updates**: Socket.io powered real-time alerts and live support chat.
- **Beautiful Transactional Emails**: Custom Razorpay-styled, fully responsive HTML emails powered by Resend for OTPs, Purchase Invoices, Sale Alerts, and Payout Requests.

### Authentication
- **Multi-Auth Support**: Traditional Email/Password with OTP email verification, alongside secure OAuth integrations (Google, GitHub) using Passport.js.

---

## Technology Stack

### Frontend (Client)
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Framer Motion (Micro-animations)
- **State Management:** Zustand & React Query (@tanstack/react-query)
- **PWA:** Custom Service Workers, Web Manifest
- **Push Notifications:** Firebase Web SDK

### Backend (Server)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose)
- **Authentication:** JWT & Passport.js
- **Real-Time:** Socket.io
- **Emails:** Resend API
- **Storage:** Cloudflare R2 (Products) & Cloudinary (Images)
- **Security:** VirusTotal API
- **Payments:** Razorpay API

---

## Project Structure

```text
Bitforge/
├── client/          # Next.js 16 Frontend
│   ├── app/         # App router pages & layouts
│   ├── components/  # Reusable UI components & PWA configuration
│   ├── lib/         # Utility functions (Firebase, API configs)
│   └── public/      # Static assets, Service Workers, Manifest
│
├── server/          # Express.js Backend
│   ├── src/
│   │   ├── config/      # Environment & database configs
│   │   ├── controllers/ # Route logic (Sellers, Buyers, Admin)
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # Express API routes
│   │   ├── utils/       # Helpers (Email templates, PDF Generation)
│   │   └── lib/         # Socket.io configuration
│   └── scripts/         # Utility and maintenance scripts
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Cloudflare R2, Cloudinary, Razorpay, Resend, and Firebase accounts

### Environment Variables

#### Client (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

#### Server (`server/.env`)
```env
PORT=4000
CLIENT_URL=http://localhost:3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# OAuth
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GITHUB_CLIENT_ID=your_github_id
GITHUB_CLIENT_SECRET=your_github_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Cloudflare R2 (Products)
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_ENDPOINT=your_r2_endpoint
R2_BUCKET_NAME=your_r2_bucket

# VirusTotal
VIRUSTOTAL_API_KEY=your_virustotal_api_key

# Firebase Admin
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# Resend (Emails)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_sender
ADMIN_EMAIL=your_admin_inbox
```

### Installation

**1. Clone the repository**
```bash
git clone <your-repo-url>
cd contentSellify
```

**2. Install dependencies**
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

**3. Start the development servers**
```bash
# Terminal 1: Start Backend (Runs on Port 4000)
cd server
npm run dev

# Terminal 2: Start Frontend (Runs on Port 3000)
cd client
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/api

---

## Core API Structure

All backend API endpoints are cleanly structured under `/api`:

- `/api/auth` - Authentication & Registration (Local + OAuth)
- `/api/users` - Profile management & Wallets
- `/api/products` - Product uploading, fetching, & VirusTotal scanning
- `/api/seller` - Seller dashboard, earnings, & payouts
- `/api/admin` - Global platform moderation & approvals
- `/api/payments` - Razorpay order creation & webhook verification
- `/api/cart` - Cart & Wishlist persistence
- `/api/chat` - Real-time support chat system

---

## Production Deployment
- The frontend is optimized for **Vercel** deployment with Turbopack enabled.
- The backend can be deployed to **Render, AWS EC2, or DigitalOcean App Platform**.
- Ensure `process.env.NODE_ENV === "production"` is active so the Next.js Service Worker correctly caches resources.
- All development logs are suppressed in production.
