
import AccountReport from "../models/AccountReport.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Submit a user report (public endpoint — no auth token required)
 * Accepts multipart/form-data with optional proof images.
 */
export const submitReport = async (req, res) => {
  try {
    const { reporterEmail, reporterName, issueType, description, reportedUserId } = req.body;
    console.log("[submitReport] Headers:", req.headers['content-type']);
    console.log("[submitReport] Body:", req.body);
    console.log("[submitReport] Files:", req.files?.length);

    // Validate required fields
    if (!reporterEmail || !issueType || !description) {
      return res.status(400).json({
        message: "Email, issue type, and description are required",
      });
    }

    if (description.trim().length < 20) {
      return res.status(400).json({
        message: "Description must be at least 20 characters",
      });
    }

    // Upload proof files to Cloudinary (if any)
    const proofUrls = [];
    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({ message: "Maximum 5 proof files allowed" });
      }

      for (const file of req.files) {
        try {
          const b64 = Buffer.from(file.buffer).toString("base64");
          const dataURI = `data:${file.mimetype};base64,${b64}`;

          const uploadResult = await cloudinary.uploader.upload(dataURI, {
            folder: "sellify/account-reports",
            resource_type: "auto",
            allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf"],
          });

          proofUrls.push(uploadResult.secure_url);
        } catch (uploadErr) {
          console.error("Proof upload error:", uploadErr);
          // Continue without failing the whole report
        }
      }
    }

    const report = await AccountReport.create({
      reportedBy: req.user?._id || null,
      reporterEmail: reporterEmail.toLowerCase().trim(),
      reporterName: reporterName?.trim() || undefined,
      issueType,
      description: description.trim(),
      proofUrls,
    });

    res.status(201).json({
      message: "Report submitted successfully. Our team will review it within 2–3 business days.",
      reportId: report.reportId,
    });
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ message: "Failed to submit report" });
  }
};

/**
 * Admin — Get all reports with filters
 */
export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 15, status = "all" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status !== "all") query.status = status;

    const reports = await AccountReport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("reportedBy", "name email role")
      .populate("reviewedBy", "name email");

    const total = await AccountReport.countDocuments(query);
    const pendingCount = await AccountReport.countDocuments({ status: "pending" });
    const underReviewCount = await AccountReport.countDocuments({ status: "under_review" });

    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      stats: {
        total,
        pending: pendingCount,
        underReview: underReviewCount,
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

/**
 * Admin — Update report status and add notes
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ["pending", "under_review", "resolved", "dismissed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const report = await AccountReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = status;
    if (adminNotes) report.adminNotes = adminNotes.trim();
    
    // Always update reviewer info on any status change (not just resolved/dismissed)
    report.reviewedBy = req.user._id || req.user.id;
    report.reviewedAt = new Date();

    // Log the action to the history array
    report.actionHistory.push({
      status: report.status,
      adminNotes: report.adminNotes,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt
    });

    await report.save();

    res.json({ message: "Report updated successfully", report });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ message: "Failed to update report" });
  }
};

/**
 * Get current user's submitted reports
 */
export const getMyReports = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch reports where reportedBy matches the authenticated user ID
    // or fallback to matching their email address
    const reports = await AccountReport.find({
      $or: [
        { reportedBy: req.user.id },
        { reporterEmail: req.user.email.toLowerCase() }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AccountReport.countDocuments({
      $or: [
        { reportedBy: req.user.id },
        { reporterEmail: req.user.email.toLowerCase() }
      ]
    });

    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching my reports:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};
