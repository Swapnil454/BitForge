

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendOtpEmail } from "../utils/sendEmail.js";
import { generateToken } from "../utils/token.js";
import { createNotification } from "./notification.controller.js";

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Temporary storage for pending user registrations
const pendingRegistrations = new Map();

// Get pending registration count (for monitoring)
export const getPendingRegistrationsCount = () => pendingRegistrations.size;

// Clean up expired registrations every 2 minutes
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [email, data] of pendingRegistrations) {
    if (data.expiresAt < now) {
      pendingRegistrations.delete(email);
      cleanedCount++;
    }
  }
}, 2 * 60 * 1000);

// Add function to manually resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    const pendingUser = pendingRegistrations.get(email);
    if (!pendingUser) {
      return res.status(404).json({ message: "No pending registration found. Please register again." });
    }
    
    // Generate new OTP and extend expiration
    const newOtp = generateOtp();
    pendingUser.otp = newOtp;
    pendingUser.expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await sendOtpEmail(email, newOtp);
    
    res.json({ message: "New verification code sent to your email" });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({ message: "Failed to resend verification code" });
  }
};

/**
 * REGISTER
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'buyer' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Validate role
    const validRoles = ['buyer', 'seller', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    // Store user data temporarily instead of creating in DB
    const pendingUserData = {
      name,
      email,
      password: hashedPassword,
      role,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    pendingRegistrations.set(email, pendingUserData);

    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Remove from temporary storage if email fails
      pendingRegistrations.delete(email);
      return res.status(500).json({
        message: "Failed to send verification email. Please try again."
      });
    }

    res.status(201).json({
      message: "Verification code sent to your email. Please verify to complete registration."
    });
  } catch (err) {
    console.error("Registration Error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * VERIFY OTP
 */
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check if there's a pending registration for this email
    const pendingUser = pendingRegistrations.get(email);
    
    if (!pendingUser) {
      return res.status(404).json({ message: "No pending registration found. Please register again." });
    }
    // Check if OTP has expired
    if (pendingUser.expiresAt < Date.now()) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ message: "Verification code has expired. Please register again." });
    }

    // Verify OTP
    if (pendingUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Check one more time if user exists in database (race condition protection)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      pendingRegistrations.delete(email);
      return res.status(409).json({ message: "Email already registered" });
    }

    // Create user in database
    const userDataForDB = {
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      role: pendingUser.role || 'buyer',
      isVerified: true,
      emailOtp: null,
      emailOtpExpires: null
    };

    const newUser = await User.create(userDataForDB);

    // If seller registered, notify admin
    if (newUser.role === 'seller') {
      try {
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await createNotification(
            admin._id,
            'product_pending_review',
            'New Seller Registration',
            `${newUser.name} (${newUser.email}) has registered as a seller and is awaiting approval.`,
            newUser._id,
            'User'
          );
        }
      } catch (notifError) {
        console.error('Failed to create admin notification:', notifError);
        // Don't fail the registration if notification fails
      }
    }

    // Generate JWT token for the new user
    const token = generateToken(newUser);

    // Remove from pending registrations
    pendingRegistrations.delete(email);

    res.status(201).json({ 
      message: "Email verified successfully! Your account has been created.",
      token, // Include token for automatic login
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role, // Include role in response
        isVerified: newUser.isVerified
      }
    });
  } catch (err) {
    console.error("OTP Verification Error:", err);
    res.status(500).json({ message: "Server error during verification" });
  }
};

/**
 * LOGIN
 */
export const login = async (req, res) => {
  try {
    const { loginId, password } = req.body;

    // Validate required fields
    if (!loginId || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email (loginId can be either email or phone)
    const user = await User.findOne({
      $or: [
        { email: loginId.toLowerCase() },
        { phone: loginId }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Please verify your email first",
        needsVerification: true 
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'buyer', // Include role field
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ 
      message: "Server error during login",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * FORGOT PASSWORD
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first before resetting password" });
    }

    // Generate reset OTP
    const resetOtp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with reset OTP
    user.resetPasswordOtp = resetOtp;
    user.resetPasswordOtpExpires = otpExpires;
    await user.save();

    // Send reset email
    try {
      await sendOtpEmail(email, resetOtp, 'Password Reset');
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      // Clear the OTP if email fails
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      await user.save();
      return res.status(500).json({ message: "Failed to send reset email. Please try again." });
    }

    res.status(200).json({ 
      message: "Password reset code sent to your email. Please check your inbox." 
    });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ 
      message: "Server error during password reset request",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * RESET PASSWORD
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate required fields
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    // Check if reset OTP exists
    if (!user.resetPasswordOtp) {
      return res.status(400).json({ message: "No password reset request found. Please request a new reset code." });
    }

    // Check if OTP has expired
    if (user.resetPasswordOtpExpires < new Date()) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      await user.save();
      return res.status(400).json({ message: "Reset code has expired. Please request a new one." });
    }

    // Verify OTP
    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful! You can now login with your new password." });

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ 
      message: "Server error during password reset",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};
