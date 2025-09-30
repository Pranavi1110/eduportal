const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please add a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    userType: {
      type: String,
      required: [true, "Please specify user type"],
      enum: ["student", "startup", "admin"],
      default: "student",
    },
    companyName: {
      type: String,
      required: function () {
        return this.userType === "startup";
      }
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot be more than 50 characters"],
      required: function () {
        return this.userType === "student";
      },
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot be more than 50 characters"],
      required: function () {
        return this.userType === "student";
      },
    },
    profilePicture: {
      type: String,
      default: "",
    },
    resume: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    // Student-specific fields
    college: {
      type: String,
      trim: true,
      maxlength: [100, "College name cannot be more than 100 characters"],
    },
    collegeEmail: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)@\w+([.-]?\w+)(\.\w{2,3})+$/,
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
          maxlength: [300, "Experience description cannot be more than 300 characters"],
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
          maxlength: [500, "Project description cannot be more than 500 characters"],
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
    // Certificates earned by the student
    certificates: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certificate'
    }],
    // Password reset token (hashed) and expiry
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "userType",
  }
);

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create the base User model
const User = mongoose.model("User", UserSchema);

module.exports = User;