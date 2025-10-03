require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
const FRONTEND_URL = "https://hubinity-umha.onrender.com"; // your deployed frontend

// CORS: explicitly reflect the requesting Origin and allow credentials
const allowedOrigins = [
  FRONTEND_URL,
  "https://hubinity.in",
  "https://www.hubinity.in"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, Accept, X-Requested-With"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Keep cors middleware for safety (non-credentialed requests)
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Serve static files from certificates directory
app.use(
  "/api/certificates",
  express.static(path.join(__dirname, "certificates"))
);

// Serve uploaded files (avatars etc.)
app.use(
  "/api/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Help Center route
app.use("/api/help", require("./routes/help"));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User model
const User = require("./models/User");
const jwt = require("jsonwebtoken");

// Setup mail transporter using environment variables
let mailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  // If SMTP_SECURE is provided, respect it. Otherwise infer from port (465 implies secure)
  const smtpSecure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465;

  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Timeouts to avoid long hangs on providers/platforms
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  // Verify SMTP connection (non-fatal)
  mailTransporter.verify((error) => {
    if (error) {
      console.error("SMTP connection error:", error);
    } else {
      console.log("SMTP server is ready to take our messages");
    }
  });
} else {
  console.warn(
    "SMTP not configured. Forgot-password emails will be logged to console. Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env to enable real emails."
  );
}

// Register route
app.post("/api/register", async (req, res) => {
  const { firstName, lastName, email, password, userType, companyName } =
    req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Include companyName only for startup users
    const newUserData = {
      firstName,
      lastName,
      email,
      password,
      userType,
      ...(userType === "startup" && { companyName }),
    };

    user = new User(newUserData);
    await user.save();

    // Send welcome email
    try {
      const displayName = (user.firstName || user.companyName || user.email).trim();
      const mailSubject = 'Welcome to Hubinity — Limitless Hustle, One Hub!';
      const mailText = `Hi ${displayName},\n\nWelcome on board Hubinity – Limitless Hustle, One Hub! 🚀\nYou’ve just taken your first step toward connecting with amazing opportunities and changemakers.\n\nHere’s what’s next:\nComplete your profile so we can match you with the right opportunities.\nExplore the dashboard for posted tasks, startup listings, and student portfolios.\nStay active — the more you engage, the more badges, certificates, and gigs you can earn.\n\n🔑 Login to get started: \nWhether you’re here to showcase your skills or find passionate talent, we can’t wait to see your journey unfold.
\nKeep Hustling,\nTeam Hubinity\nHubinity.in\nBuild. Hustle. Connect.`;

      if (mailTransporter) {
        await mailTransporter.sendMail({
          from: `"Hubinity Support" <support@hubinity.in>`,
          to: user.email,
          subject: mailSubject,
          text: mailText,
        });
      } else {
        console.log('Welcome email (not sent) to %s:\n%s', user.email, mailText);
      }
    } catch (emailErr) {
      console.error('Error sending welcome email:', emailErr);
    }

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(400).json({ message: err.message });
  }
});

// Login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last login timestamp
    try {
      user.lastLogin = new Date();
      await user.save();
    } catch (e) {
      console.error("Error updating last login:", e);
    }
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        ...(user.userType === "startup" && { companyName: user.companyName }),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Forgot password route - generate reset token, save to user (hashed) and send email with link
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal whether the email exists
      return res.status(200).json({
        message:
          "If an account with that email exists, a reset email has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const expire = Date.now() + 1000 * 60 * 60; // 1 hour

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = new Date(expire);
    await user.save();

    // Create reset URL - frontend route should handle resetting
    const resetUrl = `${
      process.env.FRONTEND_BASE_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const mailSubject = "Hubinity - Password Reset";
    const mailText = `Hello ${
      user.firstName || user.email
    },\n\nYou requested a password reset. Click the link below to reset your password (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    if (mailTransporter) {
      const info = await mailTransporter.sendMail({
        from: `"Hubinity Support" <support@hubinity.in>`,
        to: user.email,
        subject: mailSubject,
        text: mailText,
      });
      console.log("Password reset email sent:", info.messageId);
    } else {
      console.log("Password reset link for %s: %s", user.email, resetUrl);
    }

    return res.status(200).json({
      message:
        "If an account with that email exists, a reset email has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Reset password route - verify token and set new password
app.post("/api/reset-password", async (req, res) => {
  const { email, token, password } = req.body;
  if (!email || !token || !password)
    return res.status(400).json({ message: "Email, token and new password are required" });

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Student, Startup, Chat, and Users routes
const studentRoutes = require("./routes/student");
const startupRoutes = require("./routes/startup");
const chatRoutes = require("./routes/chat");
const usersRoutes = require("./routes/users");
const uploadsRoutes = require("./routes/uploads");
app.use("/api/student", studentRoutes);
app.use("/api/startup", startupRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/uploads", uploadsRoutes);
// Admin routes
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
