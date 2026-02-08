import mongoose from "mongoose";

const careerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      enum: ["Engineering", "Product", "Design", "Operations", "Marketing", "Sales", "Support", "Other"],
    },
    location: {
      type: String,
      required: true,
      default: "Remote",
    },
    employmentType: {
      type: String,
      required: true,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      default: "Full-time",
    },
    experience: {
      type: String,
      required: true,
      default: "0-2 years",
    },
    description: {
      type: String,
      required: true,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    niceToHave: {
      type: [String],
      default: [],
    },
    benefits: {
      type: [String],
      default: [],
    },
    salary: {
      min: {
        type: Number,
        default: null,
      },
      max: {
        type: Number,
        default: null,
      },
      currency: {
        type: String,
        default: "INR",
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },
    applyUrl: {
      type: String,
      default: "",
    },
    applyEmail: {
      type: String,
      default: "",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    openings: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
careerSchema.index({ status: 1, createdAt: -1 });
careerSchema.index({ department: 1, status: 1 });
careerSchema.index({ featured: 1, status: 1 });

const Career = mongoose.model("Career", careerSchema);

export default Career;
