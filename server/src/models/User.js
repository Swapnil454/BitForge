
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      minlength: 6
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer'
    },
    phone: {
      type: String,
      sparse: true,
      unique: true
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    emailOtp: String,
    emailOtpExpires: Date,
    
    // Password Reset Fields
    resetPasswordOtp: String,
    resetPasswordOtpExpires: Date,
    resetPasswordOTP: String,
    resetPasswordExpire: Date,

    // Account Deletion Verification
    deletionOTP: String,
    deletionOTPExpire: Date,

    // Seller Account Deletion Request (requires admin approval)
    deletionRequestStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    deletionRequestReason: String,
    deletionRequestDate: Date,
    deletionRejectionReason: String,
    
    // Profile Picture
    profilePictureUrl: {
      type: String,
      default: null,
    },
    profilePictureKey: {
      type: String,
      default: null,
    },
    
    // OAuth Fields
    googleId: String,
    githubId: String,
    avatar: String,
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local'
    },

    isApproved: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvalReason: {
      type: String,
    },

    // Bank Accounts (Multiple accounts support)
    bankAccounts: [{
      accountHolderName: {
        type: String,
        required: true
      },
      accountNumber: {
        type: String,
        required: true
      },
      ifscCode: {
        type: String,
        required: true
      },
      bankName: String,
      branchName: String,
      accountType: {
        type: String,
        enum: ['savings', 'current'],
        default: 'savings'
      },
      isPrimary: {
        type: Boolean,
        default: false
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      razorpayContactId: String,
      razorpayFundAccountId: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],

  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
