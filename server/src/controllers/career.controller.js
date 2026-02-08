import Career from "../models/Career.js";

// @desc    Get all published careers (public)
// @route   GET /api/careers
// @access  Public
export const getPublicCareers = async (req, res) => {
  try {
    const careers = await Career.find({ status: "published" })
      .sort({ featured: -1, createdAt: -1 })
      .select("-createdBy -updatedBy -__v");

    res.json({
      success: true,
      count: careers.length,
      data: careers,
    });
  } catch (error) {
    console.error("Error fetching public careers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch careers",
      error: error.message,
    });
  }
};

// @desc    Get all careers (admin)
// @route   GET /api/admin/careers
// @access  Admin
export const getAllCareers = async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (department) filter.department = department;

    const careers = await Career.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: careers.length,
      data: careers,
    });
  } catch (error) {
    console.error("Error fetching careers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch careers",
      error: error.message,
    });
  }
};

// @desc    Get single career
// @route   GET /api/careers/:id
// @access  Public
export const getCareerById = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);

    if (!career) {
      return res.status(404).json({
        success: false,
        message: "Career not found",
      });
    }

    // Only allow non-admins to view published careers
    if (career.status !== "published" && (!req.user || req.user.role !== "admin")) {
      return res.status(404).json({
        success: false,
        message: "Career not found",
      });
    }

    res.json({
      success: true,
      data: career,
    });
  } catch (error) {
    console.error("Error fetching career:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch career",
      error: error.message,
    });
  }
};

// @desc    Create new career
// @route   POST /api/admin/careers
// @access  Admin
export const createCareer = async (req, res) => {
  try {
    const careerData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const career = await Career.create(careerData);

    res.status(201).json({
      success: true,
      message: "Career created successfully",
      data: career,
    });
  } catch (error) {
    console.error("Error creating career:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create career",
      error: error.message,
    });
  }
};

// @desc    Update career
// @route   PUT /api/admin/careers/:id
// @access  Admin
export const updateCareer = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);

    if (!career) {
      return res.status(404).json({
        success: false,
        message: "Career not found",
      });
    }

    const updatedCareer = await Career.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Career updated successfully",
      data: updatedCareer,
    });
  } catch (error) {
    console.error("Error updating career:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update career",
      error: error.message,
    });
  }
};

// @desc    Delete career
// @route   DELETE /api/admin/careers/:id
// @access  Admin
export const deleteCareer = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);

    if (!career) {
      return res.status(404).json({
        success: false,
        message: "Career not found",
      });
    }

    await Career.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Career deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting career:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete career",
      error: error.message,
    });
  }
};

// @desc    Update career status
// @route   PATCH /api/admin/careers/:id/status
// @access  Admin
export const updateCareerStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["draft", "published", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const career = await Career.findById(req.params.id);

    if (!career) {
      return res.status(404).json({
        success: false,
        message: "Career not found",
      });
    }

    career.status = status;
    career.updatedBy = req.user._id;
    await career.save();

    res.json({
      success: true,
      message: `Career ${status} successfully`,
      data: career,
    });
  } catch (error) {
    console.error("Error updating career status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update career status",
      error: error.message,
    });
  }
};

// @desc    Get career statistics
// @route   GET /api/admin/careers/stats
// @access  Admin
export const getCareerStats = async (req, res) => {
  try {
    const stats = await Career.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const departmentStats = await Career.aggregate([
      { $match: { status: "published" } },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        byDepartment: departmentStats,
      },
    });
  } catch (error) {
    console.error("Error fetching career stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch career statistics",
      error: error.message,
    });
  }
};
