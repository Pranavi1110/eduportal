const mongoose = require("mongoose");
const User = require("./User");

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  college: {
    type: String,
    trim: true,
    maxlength: [100, "College name cannot be more than 100 characters"],
  },
  collegeEmail: {
    type: String,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email",
    ],
  },
  bio: {
    type: String,
    maxlength: [500, "Bio cannot be more than 500 characters"],
  },
  skills: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
        default: "beginner",
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      verificationTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  experience: [
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },
      company: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        maxlength: [
          300,
          "Experience description cannot be more than 300 characters",
        ],
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
      },
      isCurrent: {
        type: Boolean,
        default: false,
      },
    },
  ],
  availability: {
    isAvailable: {
      type: Boolean,
      default: true,
    },
    hoursPerWeek: {
      type: Number,
      min: 1,
      max: 40,
      default: 20,
    },
    preferredSchedule: {
      type: String,
      enum: ["flexible", "weekdays", "weekends", "evenings"],
      default: "flexible",
    },
  },
  projects: [
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        maxlength: [
          500,
          "Project description cannot be more than 500 characters",
        ],
      },
      link: {
        type: String,
        trim: true,
      },
      fileUrl: {
        type: String,
      },
      technologies: [
        {
          type: String,
          trim: true,
        },
      ],
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // badges, certificates, rating, completedTasks, totalEarnings removed
});

module.exports = User.discriminator("Student", studentSchema);
