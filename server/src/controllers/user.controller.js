import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { sendOtpEmail } from "../utils/sendEmail.js";
import { createNotification } from "./notification.controller.js";

// Configure Cloudinary (already configured in your app)

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -resetPasswordOTP -resetPasswordExpire");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }

    let profilePictureUrl = req.user.profilePictureUrl;
    let profilePictureKey = req.user.profilePictureKey;

    // Handle profile picture upload if file is present
    if (req.file) {
      // Delete old profile picture from Cloudinary if exists
      if (profilePictureKey) {
        try {
          await cloudinary.uploader.destroy(profilePictureKey);
        } catch (deleteError) {
          console.error("Error deleting old profile picture:", deleteError);
        }
      }

      // Upload new profile picture
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: "sellify/profile-pictures",
        resource_type: "auto",
      });

      profilePictureUrl = uploadResult.secure_url;
      profilePictureKey = uploadResult.public_id;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: name.trim(),
        profilePictureUrl,
        profilePictureKey,
      },
      { new: true }
    ).select("-password -resetPasswordOTP -resetPasswordExpire");

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// Change password (requires old password)
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from old password" });
    }

    // Verify old password
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

// Request password reset (send OTP to email)
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save OTP to user
    user.resetPasswordOTP = otp;
    user.resetPasswordExpire = otpExpiry;
    await user.save();

    // Send OTP via email using SendGrid
    try {
      await sendOtpEmail(email, otp, 'Password Reset');
      res.json({ message: "OTP sent to your email" });
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      return res.status(500).json({ message: "Failed to send OTP email" });
    }
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.status(500).json({ message: "Failed to request password reset" });
  }
};

// Verify OTP and reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // Validate inputs
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP exists and is not expired
    if (!user.resetPasswordOTP || !user.resetPasswordExpire) {
      return res.status(400).json({ message: "No password reset request found. Please request again" });
    }

    if (new Date() > user.resetPasswordExpire) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one" });
    }

    // Verify OTP
    if (user.resetPasswordOTP !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// Request account deletion (send OTP)
export const requestAccountDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.deletionOTP = otp;
    user.deletionOTPExpire = otpExpiry;
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, 'Account Deletion');
      return res.json({ message: "Verification code sent to your email" });
    } catch (emailError) {
      console.error("Error sending account deletion OTP:", emailError);
      return res.status(500).json({ message: "Failed to send verification email" });
    }
  } catch (error) {
    console.error("Error requesting account deletion:", error);
    res.status(500).json({ message: "Failed to request account deletion" });
  }
};

// Confirm account deletion (verify OTP + reason, notify admins, delete user or request approval)
export const confirmAccountDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp, reason } = req.body;

    if (!otp || !reason || String(reason).trim().length < 3) {
      return res.status(400).json({ message: "Verification code and a valid reason are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate OTP presence and expiry
    if (!user.deletionOTP || !user.deletionOTPExpire) {
      return res.status(400).json({ message: "No deletion request found. Please request again" });
    }

    if (new Date() > user.deletionOTPExpire) {
      user.deletionOTP = undefined;
      user.deletionOTPExpire = undefined;
      await user.save();
      return res.status(400).json({ message: "Verification code has expired. Please request a new one" });
    }

    // Verify OTP match
    if (user.deletionOTP !== otp) {
      return res.status(401).json({ message: "Invalid verification code" });
    }

    // Clear OTP fields
    user.deletionOTP = undefined;
    user.deletionOTPExpire = undefined;

    // BUYER: Delete immediately and notify admins
    if (user.role === 'buyer') {
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
          await createNotification(
            admin._id,
            'user_deleted',
            'Buyer Account Deleted',
            `${user.name} (${user.email}) deleted their account. Reason: ${String(reason).trim()}`,
            user._id,
            'User'
          );
        }
      } catch (notifyErr) {
        console.error("Error creating admin notifications for buyer deletion:", notifyErr);
      }

      await user.save();
      await User.findByIdAndDelete(userId);

      return res.json({ message: "Account deleted successfully" });
    }

    // SELLER: Request admin approval
    if (user.role === 'seller') {
      user.deletionRequestStatus = 'pending';
      user.deletionRequestReason = String(reason).trim();
      user.deletionRequestDate = new Date();
      await user.save();

      // Notify all admins about seller deletion request
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
          await createNotification(
            admin._id,
            'seller_deletion_requested',
            'Seller Account Deletion Requested',
            `${user.name} (${user.email}) requested to delete their account. Reason: ${user.deletionRequestReason}`,
            user._id,
            'User'
          );
        }
      } catch (notifyErr) {
        console.error("Error creating admin notifications for seller deletion request:", notifyErr);
      }

      return res.json({ 
        message: "Deletion request submitted. Admin approval required. You will be notified once reviewed.",
        requiresApproval: true 
      });
    }

    return res.status(400).json({ message: "Invalid user role" });
  } catch (error) {
    console.error("Error confirming account deletion:", error);
    res.status(500).json({ message: "Failed to delete account" });
  }
};

// Request account deletion (send OTP)
