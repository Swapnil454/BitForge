# ContentSellify

A full-stack digital marketplace platform for buying and selling digital content.

## Features

- **User Authentication**: OAuth integration (Google, GitHub) and email-based registration
- **Role-based Access**: Support for Buyers, Sellers, and Admins
- **Product Management**: Upload, manage, and sell digital products
- **Payment Integration**: Secure payment processing
- **Real-time Notifications**: Socket.io integration for live updates
- **Admin Dashboard**: Comprehensive admin panel for product and user management
- **Order Management**: Complete order tracking and fulfillment system
- **Cart & Wishlist**: Shopping cart and wishlist functionality

## Tech Stack

### Frontend (Client)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Notifications**: React Hot Toast

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, Passport.js (OAuth)
- **File Storage**: Cloudinary
- **Email**: SendGrid
- **Real-time**: Socket.io

## Project Structure

```
contentSellify/
├── client/          # Next.js frontend application
│   ├── app/         # App router pages
│   ├── components/  # Reusable components
│   ├── lib/         # Utility functions
│   └── public/      # Static assets
├── server/          # Express.js backend
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   ├── utils/       # Utility functions
│   │   └── lib/         # Libraries (Socket.io)
│   └── scripts/     # Utility scripts
└── docs/            # Documentation
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Environment Variables

#### Client (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Server (.env)
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### Installation

#### 1. Clone the repository
```bash
git clone <your-repo-url>
cd contentSellify
```

#### 2. Install dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

#### 3. Configure environment variables
Create `.env` files in both `client` and `server` directories with the required variables.

#### 4. Start the development servers

**Server:**
```bash
cd server
npm run dev
```

**Client:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## API Documentation

API endpoints are organized under `/api`:

- `/api/auth` - Authentication endpoints
- `/api/oauth` - OAuth authentication
- `/api/products` - Product management
- `/api/marketplace` - Marketplace operations
- `/api/admin` - Admin operations
- `/api/payments` - Payment processing
- `/api/cart` - Shopping cart
- `/api/notifications` - User notifications
- `/api/chat` - Support chat

## Production Considerations

- All development console logs have been removed
- Environment variables are properly configured for production
- Error handling with appropriate logging (console.error)
- Secure authentication and authorization
- Input validation and sanitization

## License

[Add your license here]

## Contributing

[Add contribution guidelines]
