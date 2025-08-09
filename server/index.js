require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from certificates directory
app.use(
  "/api/certificates",
  express.static(path.join(__dirname, "certificates"))
);

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

// Student, Startup, Chat, and Users routes
const studentRoutes = require("./routes/student");
const startupRoutes = require("./routes/startup");
const chatRoutes = require("./routes/chat");
const usersRoutes = require("./routes/users");
app.use("/api/student", studentRoutes);
app.use("/api/startup", startupRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", usersRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
