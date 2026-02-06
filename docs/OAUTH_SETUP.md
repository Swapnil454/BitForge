# OAuth Setup Guide

This guide will help you set up OAuth authentication with Google and GitHub for your ContentSellify application.

## 1. Google OAuth Setup

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one

### Step 2: Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google OAuth2 API"

### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Set the name as "ContentSellify"
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/oauth/google/callback`
   - `https://yourdomain.com/api/oauth/google/callback` (for production)
6. Copy the Client ID and Client Secret

### Step 4: Update Environment Variables
```bash
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## 2. GitHub OAuth Setup

### Step 1: Go to GitHub Developer Settings
1. Visit [GitHub Developer Settings](https://github.com/settings/developers)
2. Sign in to your GitHub account
3. Click "New OAuth App"

### Step 2: Create OAuth Application
1. Application name: "ContentSellify"
2. Homepage URL: `http://localhost:3000` (development) or your production URL
3. Authorization callback URL: `http://localhost:5000/api/oauth/github/callback`
4. Click "Register application"

### Step 3: Get Credentials
1. After creating the app, you'll see the Client ID
2. Click "Generate a new client secret"
3. Copy both the Client ID and Client Secret

### Step 4: Update Environment Variables
```bash
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

## 3. Complete Environment File

Your `.env` file should look like this:

```bash
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-super-secret-session-key

SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=your-verified-email@domain.com

# OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

## 4. Testing OAuth Flow

1. Start your backend server: `npm start`
2. Start your frontend: `npm run dev`
3. Go to the login or register page
4. Click on "Continue with Google" or "Continue with GitHub"
5. Complete the OAuth flow
6. You should be redirected back to your app with authentication

## 5. Production Considerations

### Security
- Use HTTPS in production
- Set secure session cookies
- Use strong session secrets
- Implement rate limiting

### URLs
- Update OAuth callback URLs to your production domain
- Update CORS origins to your production domain
- Update CLIENT_URL environment variable

### Environment Variables
- Never commit actual credentials to version control
- Use environment variable management tools in production
- Rotate secrets regularly

## Troubleshooting

### Common Issues
1. **"OAuth2Strategy requires a clientID option"**
   - Ensure GOOGLE_CLIENT_ID and GITHUB_CLIENT_ID are set in .env
   - Restart the server after adding credentials

2. **"Callback URL mismatch"**
   - Ensure callback URLs match exactly in OAuth provider settings
   - Include the correct port numbers

3. **CORS errors**
   - Ensure CORS is properly configured for your frontend domain
   - Include credentials: true in CORS options

4. **Session issues**
   - Ensure SESSION_SECRET is set
   - Check that session middleware is properly configured

### Testing OAuth without Real Credentials
If you want to test the application without setting up real OAuth providers, you can temporarily comment out the OAuth strategies in `passport.js` and the OAuth buttons will show but won't function.

## Next Steps
Once OAuth is working:
1. Test the complete authentication flow
2. Verify user data is properly saved
3. Test user session persistence
4. Implement proper error handling
5. Add user profile management