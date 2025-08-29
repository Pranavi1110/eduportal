const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide task title"],
      trim: true,
      maxlength: [100, "Task title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide task description"],
      maxlength: [1000, "Task description cannot be more than 1000 characters"],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Please provide task category"],
      enum: [
        // Technical categories
        "development",
        "design",
        "data-analysis",
        "testing",
        "devops",
        "mobile-development",
        "web-development",
        "ai-ml",
        "cybersecurity",
        "database",
        "api-development",
        "cloud-computing",
        // Non-technical categories
        "marketing",
        "research",
        "writing",
        "content-creation",
        "social-media",
        "business-development",
        "sales",
        "customer-support",
        "project-management",
        "hr-recruitment",
        "finance-accounting",
        "legal",
        "operations",
        "event-management",
        "translation",
        "other",
      ],
    },
    workType: {
      type: String,
      required: [true, "Please provide work type"],
      enum: ["technical", "non-technical"],
    },
    skills: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    difficulty: {
      type: String,
      enum: ["", "beginner", "intermediate", "advanced", "expert"],
    },
    estimatedHours: {
      type: Number,
      min: 1,
      max: 200,
    },
    budget: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "open",
        "assigned",
        "in-progress",
        "submitted",
        "under-review",
        "review",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    applicants: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
        proposal: {
          type: String,
          maxlength: [500, "Proposal cannot be more than 500 characters"],
        },
        bidAmount: {
          type: Number,
          min: 0,
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    attachments: [
      {
        name: {
          type: String,
        },
        url: {
          type: String,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deliverables: [
      {
        name: {
          type: String,
        },
        description: {
          type: String,
        },
        fileUrl: {
          type: String,
        },
        submittedAt: {
          type: Date,
        },
        isApproved: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Student submissions for links
    submissions: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        link: {
          type: String,
          required: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "under-review", "approved", "rejected"],
          default: "pending",
        },
        reviewedAt: {
          type: Date,
        },
        reviewNotes: {
          type: String,
          maxlength: [500, "Review notes cannot be more than 500 characters"],
        },
      },
    ],
    progress: {
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      milestones: [
        {
          title: {
            type: String,
          },
          description: {
            type: String,
          },
          isCompleted: {
            type: Boolean,
            default: false,
          },
          completedAt: {
            type: Date,
          },
        },
      ],
    },
    reviews: [
      {
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: [300, "Review comment cannot be more than 300 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isVerificationTask: {
      type: Boolean,
      default: false,
    },
    verificationSkill: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
taskSchema.index({ status: 1, category: 1, skills: 1 });
taskSchema.index({ startup: 1, status: 1 });
taskSchema.index({ assignedStudent: 1, status: 1 });

module.exports = mongoose.model("Task", taskSchema);
