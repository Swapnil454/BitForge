import express from "express";
import bcrypt from "bcryptjs";
import passport from "../config/passport.js";
import { generateToken } from "../utils/token.js";
import User from "../models/User.js";

const router = express.Router();

// Google OAuth routes
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(400).json({ 
      error: 'Google OAuth not configured',
      message: 'Google OAuth credentials are missing. Please contact support.'
    });
  }
  
  // Store role in session for use in callback
  const role = req.query.role || 'buyer';
  req.session.userRole = role;
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const token = generateToken(req.user);

      // Clear session role
      delete req.session.userRole;

      // Redirect to frontend with token
      const frontendURL = `${process.env.CLIENT_URL}/auth/success?token=${token}`;
      res.redirect(frontendURL);
    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
    }
  }
);

// GitHub OAuth routes
router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(400).json({ 
      error: 'GitHub OAuth not configured',
      message: 'GitHub OAuth credentials are missing. Please contact support.'
    });
  }
  
  // Store role in session for use in callback
  const role = req.query.role || 'buyer';
  req.session.userRole = role;
  
  passport.authenticate('github', {
    scope: ['user:email']
  })(req, res, next);
});

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res) => {
    try {
      const token = generateToken(req.user);

      // Clear session role
      delete req.session.userRole;

      // Redirect to frontend with token
      const frontendURL = `${process.env.CLIENT_URL}/auth/success?token=${token}`;
      res.redirect(frontendURL);
    } catch (error) {
      console.error('❌ GitHub OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
    }
  }
);

// OAuth success endpoint for frontend to get user data
router.get('/success', async (req, res) => {
  try {
    const token = req.query.token;
    
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }
    
    // Here you could verify the token and return user data
    // For now, we'll just return success
    res.json({ 
      message: 'OAuth authentication successful',
      token
    });
  } catch (error) {
    console.error('OAuth success error:', error);
    res.status(500).json({ message: 'OAuth authentication failed' });
  }
});

router.post("/phone/signup", async (req, res) => {
  try {
    const { name, phone, password, role = 'buyer', verificationToken } = req.body;

    // Validate role
    const validRoles = ['buyer', 'seller', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // TODO: Replace with your OTP verification service
    // Example: Verify the token with your SMS/OTP provider
    /*
    const isValid = await yourOtpService.verifyToken({
      phone,
      token: verificationToken
    });
    
    if (!isValid) {
      return res.status(401).json({ message: "Invalid verification token" });
    }
    */
    
    // For now, accept any non-empty verification token
    // Remove this in production and implement proper verification
    if (!verificationToken || verificationToken === "placeholder") {
      return res.status(400).json({ 
        message: "Phone verification not properly configured. Please use email registration instead." 
      });
    }

    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      phone,
      password: hashed,
      role,
      authProvider: "phone",
      isVerified: true
    });

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error('Phone signup error:', error);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;