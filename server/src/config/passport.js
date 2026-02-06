import './env.js'; // Load environment variables first
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import GitHubStrategy from 'passport-github2';
import User from '../models/User.js';
import { generateToken } from '../utils/token.js';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy - only initialize if credentials exist
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/oauth/google/callback",
    passReqToCallback: true // This allows us to access req in the callback
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.avatar = profile.photos[0]?.value;
        user.authProvider = 'google';
        await user.save();
        return done(null, user);
      }
      
      // Create new user
      const userRole = req.session?.userRole || 'buyer';
      const newUser = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0]?.value,
        isVerified: true, // OAuth accounts are pre-verified
        authProvider: 'google',
        role: userRole
      });
      
      return done(null, newUser);
    } catch (error) {
      console.error('Google OAuth Error:', error);
      return done(error, null);
    }
  }));
  console.log('✅ Google OAuth Strategy initialized');
} else {
  console.log('⚠️  Google OAuth credentials not found. Google authentication will not be available.');
  console.log('   Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
}

// GitHub OAuth Strategy - only initialize if credentials exist
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/oauth/github/callback",
    passReqToCallback: true // This allows us to access req in the callback
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this GitHub ID
      let user = await User.findOne({ githubId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with same email
      const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
      user = await User.findOne({ email });
      
      if (user) {
        // Link GitHub account to existing user
        user.githubId = profile.id;
        user.avatar = profile.photos[0]?.value;
        user.authProvider = 'github';
        await user.save();
        return done(null, user);
      }
      
      // Create new user
      const userRole = req.session?.userRole || 'buyer';
      const newUser = await User.create({
        githubId: profile.id,
        name: profile.displayName || profile.username,
        email,
        avatar: profile.photos[0]?.value,
        isVerified: true, // OAuth accounts are pre-verified
        authProvider: 'github',
        role: userRole
      });
      
      return done(null, newUser);
    } catch (error) {
      console.error('GitHub OAuth Error:', error);
      return done(error, null);
    }
  }));
  console.log('✅ GitHub OAuth Strategy initialized');
} else {
  console.log('⚠️  GitHub OAuth credentials not found. GitHub authentication will not be available.');
  console.log('   Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your .env file');
}

export default passport;