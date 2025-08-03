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
