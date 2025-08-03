// Student routes for dashboard, tasks, profile, notifications, chat
const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/auth");

// Create a new student profile
router.post("/profile", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    // Prevent duplicate profiles for the same userId
    // Find the existing user to get required fields
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: "User not found for this userId." });
    }
    // Only pass userId and profile fields (do NOT include email, password, userType)
    // Upsert (create or update) the Student profile for this userId
    const profileFields = { ...req.body };
    delete profileFields._id;
    // Remove any fields that should not be overwritten
    const student = await Student.findOneAndUpdate(
      { userId },
      { $set: profileFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});
const Student = require("../models/Student");
const Task = require("../models/Task");
const Certificate = require("../models/Certificate");
const User = require("../models/User");

// Fetch login details from users collection for the current student
router.get("/login-details", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get student dashboard data (tasks, notifications, profile) - PUBLIC
// Get student dashboard data (tasks, notifications, profile) - PUBLIC
router.get("/dashboard", async (req, res) => {
  try {
    const { userId } = req.query;
    let student = null;
    let tasks = [];
    if (userId) {
      student = await Student.findOne({ userId });
      if (student) {
        tasks = await Task.find({ assignedTo: student._id });
      }
    }
    res.json({ student, tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Submit a task
router.post("/tasks/:taskId/submit", verifyJWT, async (req, res) => {
  try {
    const { title, link, description } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    // Mark as submitted
    task.submissions.push({
      student: req.user.id,
      title,
      link,
      description,
      status: "submitted",
    });
    await task.save();
    res.json({ message: "Task submitted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Edit student profile - PUBLIC
router.put("/profile", async (req, res) => {
  try {
    const update = req.body;
    if (!update.userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    let filter = { userId: update.userId };
    let student = await Student.findOneAndUpdate(filter, update, { new: true });
    if (!student) {
      // If no student exists, create a new one
      student = new Student({ ...update, userId: update.userId });
      await student.save();
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Get badges and certificates
router.get("/badges-certificates", verifyJWT, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).populate(
      "certificates"
    );
    res.json({ badges: student.badges, certificates: student.certificates });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
