import PageSetting from "../models/PageSetting.js";

// @desc    Get all page settings or a specific one
// @route   GET /api/settings/legal-dates
// @access  Public
export const getLegalDates = async (req, res) => {
  try {
    const { pageId } = req.query;

    if (pageId) {
      const setting = await PageSetting.findOne({ pageId });
      return res.status(200).json({
        success: true,
        data: setting || { pageId, legalEffectiveDate: "January 1, 2026", legalLastUpdatedDate: "February 1, 2026" },
      });
    }

    const settings = await PageSetting.find({});
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching legal dates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch legal dates" });
  }
};

// @desc    Update global settings (legal dates) for a specific page
// @route   PUT /api/settings/legal-dates
// @access  Admin
export const updateLegalDates = async (req, res) => {
  try {
    const { pageId, legalEffectiveDate, legalLastUpdatedDate } = req.body;

    if (!pageId) {
      return res.status(400).json({ success: false, message: "pageId is required" });
    }

    const updatedSetting = await PageSetting.findOneAndUpdate(
      { pageId },
      { legalEffectiveDate, legalLastUpdatedDate },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Legal dates updated successfully",
      data: updatedSetting,
    });
  } catch (error) {
    console.error("Error updating legal dates:", error);
    res.status(500).json({ success: false, message: "Failed to update legal dates" });
  }
};
