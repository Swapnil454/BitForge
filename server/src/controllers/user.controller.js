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

    await createNotification(
      user._id,
      "password_changed",
      "Password changed",
      "Your BitForge password was changed successfully. If this was not you, contact support immediately.",
      user._id,
      "User",
      {
        audienceRole: user.role,
        pushWhenInactiveOnly: false,
      }
    );

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

    await createNotification(
      user._id,
      "password_reset",
      "Password reset completed",
      "Your BitForge password was reset successfully. If this was not you, secure your account right away.",
      user._id,
      "User",
      {
        audienceRole: user.role,
        pushWhenInactiveOnly: false,
      }
    );

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

    // BUYER: Soft-delete (mark as deleted, preserve data)
    if (user.role === 'buyer') {
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
          await createNotification(
            admin._id,
            'user_deleted',
            'Buyer Account Deactivated',
            `${user.name} (${user.email}) deactivated their account. Reason: ${String(reason).trim()}`,
            user._id,
            'User'
          );
        }
      } catch (notifyErr) {
        console.error("Error creating admin notifications for buyer deletion:", notifyErr);
      }

      // Soft-delete: change status, do NOT remove the document
      user.accountStatus = 'deleted';
      user.accountStatusUpdatedAt = new Date();
      user.deletedAt = new Date();
      await user.save();

      return res.json({ message: "Account deactivated successfully" });
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

/**
 * REQUEST REACTIVATION OTP
 * Public endpoint — sends OTP to the email of a deleted account.
 */
export const requestReactivationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    if (user.accountStatus !== 'deleted') {
      return res.status(400).json({ message: "This account is not eligible for reactivation" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.deletionOTP = otp;
    user.deletionOTPExpire = otpExpiry;
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, 'Account Reactivation');
      return res.json({ message: "Reactivation code sent to your email" });
    } catch (emailError) {
      console.error("Error sending reactivation OTP:", emailError);
      return res.status(500).json({ message: "Failed to send reactivation email" });
    }
  } catch (error) {
    console.error("Error requesting reactivation OTP:", error);
    res.status(500).json({ message: "Failed to request reactivation" });
  }
};

/**
 * REACTIVATE ACCOUNT
 * Public endpoint — verifies OTP and restores accountStatus to 'active'.
 */
export const reactivateAccount = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    if (user.accountStatus !== 'deleted') {
      return res.status(400).json({ message: "This account is not eligible for reactivation" });
    }

    if (!user.deletionOTP || !user.deletionOTPExpire) {
      return res.status(400).json({ message: "No reactivation request found. Please request a new code" });
    }

    if (new Date() > user.deletionOTPExpire) {
      user.deletionOTP = undefined;
      user.deletionOTPExpire = undefined;
      await user.save();
      return res.status(400).json({ message: "Reactivation code has expired. Please request a new one" });
    }

    if (user.deletionOTP !== otp) {
      return res.status(401).json({ message: "Invalid reactivation code" });
    }

    // Restore account
    user.accountStatus = 'active';
    user.accountStatusUpdatedAt = new Date();
    user.deletedAt = undefined;
    user.deletionOTP = undefined;
    user.deletionOTPExpire = undefined;
    await user.save();

    // Generate token for immediate login
    const { generateToken } = await import('../utils/token.js');
    const token = generateToken(user);

    res.json({
      message: "Account reactivated successfully. Welcome back!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        accountStatus: user.accountStatus,
        approvalStatus: user.approvalStatus,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    console.error("Error reactivating account:", error);
    res.status(500).json({ message: "Failed to reactivate account" });
  }
};

/**
 * UPDATE PREFERENCES
 * Protected endpoint — updates user preferences like theme.
 */
export const updatePreferences = async (req, res) => {
  try {
    const { theme } = req.body;
    const userId = req.user.id;

    if (!["light", "dark", "system"].includes(theme)) {
      return res.status(400).json({ message: "Invalid theme" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { "preferences.theme": theme },
      { new: true }
    ).select("-password -resetPasswordOTP -resetPasswordExpire");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ message: "Failed to update preferences" });
  }
};

/**
 * Upload identity documents
 * Expects multipart/form-data with 'documents' and 'documentTypes' (as a stringified array or multiple values)
 */
export const uploadIdentityDocuments = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'seller') {
      return res.status(403).json({ message: "Only sellers can upload identity documents." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No documents provided." });
    }

    // Parse document types from the request body
    let documentTypes = [];
    if (req.body.documentTypes) {
      if (Array.isArray(req.body.documentTypes)) {
        documentTypes = req.body.documentTypes;
      } else {
        try {
          documentTypes = JSON.parse(req.body.documentTypes);
        } catch (e) {
          documentTypes = [req.body.documentTypes];
        }
      }
    }

    // Determine current submission round
    let currentRound = 1;
    if (user.identityDocuments && user.identityDocuments.length > 0) {
      const highestRound = Math.max(...user.identityDocuments.map(d => d.submissionRound || 1));
      if (user.identityVerificationStatus === 'rejected') {
        currentRound = highestRound + 1;
      } else {
        currentRound = highestRound;
      }
    }

    const uploadedDocs = [];
    
    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const docType = documentTypes[i] || 'government_id'; // fallback
      
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = "data:" + file.mimetype + ";base64," + b64;
      
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: "identity_documents",
        type: "authenticated",
        access_mode: "authenticated",
        resource_type: "auto"
      });

      uploadedDocs.push({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        documentType: docType,
        uploadedAt: new Date(),
        submissionRound: currentRound,
        status: 'pending'
      });
    }

    // Ensure at least one government_id is uploaded in this round
    const hasGovId = uploadedDocs.some(d => d.documentType === 'government_id');
    if (!hasGovId) {
      // Cleanup uploaded files on cloudinary if validation fails post-upload
      for (const doc of uploadedDocs) {
        await cloudinary.uploader.destroy(doc.public_id, { type: 'authenticated' });
      }
      return res.status(400).json({ message: "At least one Government ID is required." });
    }

    // Append to existing documents
    if (!user.identityDocuments) user.identityDocuments = [];
    user.identityDocuments.push(...uploadedDocs);
    
    // Change status
    user.identityVerificationStatus = 'pending';
    await user.save();

    res.json({ 
      success: true, 
      message: "Documents uploaded successfully. Awaiting admin review.",
      status: user.identityVerificationStatus 
    });
  } catch (error) {
    console.error("Error uploading identity documents:", error);
    res.status(500).json({ message: "Failed to upload identity documents" });
  }
};

/**
 * Get the current identity verification status
 */
export const getIdentityStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('identityVerificationStatus latestRejectionReason isApproved approvalStatus');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      status: user.identityVerificationStatus,
      rejectionReason: user.latestRejectionReason || null,
      isApproved: user.isApproved,
      approvalStatus: user.approvalStatus
    });
  } catch (error) {
    console.error("Error fetching identity status:", error);
    res.status(500).json({ message: "Failed to fetch identity status" });
  }
};

