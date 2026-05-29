
import mongoose from "mongoose";

/**
 * AccountReport Model
 * Stores user-submitted reports for banned or wrongfully restricted accounts.
 * Accessible publicly (no auth token required) since banned/deleted users lose access.
 */
const accountReportSchema = new mongoose.Schema(
  {
    // Who submitted the report (optional – banned users may not have a valid session)
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Contact email for follow-up (required when no session)
    reporterEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    reporterName: {
      type: String,
      trim: true,
    },

    // Categorized issue type
    issueType: {
      type: String,
      required: true,
      enum: [
        "wrongful_ban",
        "account_restricted",
        "login_issue",
        "data_privacy",
        "payment_issue",
        "technical_issue",
        "other",
      ],
    },

    // Detailed description of the issue
    description: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 2000,
    },

    // Cloudinary URLs for uploaded proof images/documents
    proofUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 proof files allowed",
      },
    },

    // Admin workflow status
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "dismissed"],
      default: "pending",
    },

    adminNotes: {
      type: String,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // Audit trail of actions taken by admins
    actionHistory: [
      {
        status: { type: String, required: true },
        adminNotes: { type: String, default: null },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        reviewedAt: { type: Date, default: Date.now }
      }
    ],

    // Reference tracking
    reportId: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Auto-generate a human-readable report ID before save
accountReportSchema.pre("save", function () {
  if (!this.reportId) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.reportId = `RPT-${ts}-${rand}`;
  }
});

export default mongoose.model("AccountReport", accountReportSchema);
