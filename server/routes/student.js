// Student routes for dashboard, tasks, profile, notifications, chat
const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/auth");
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
router.get("/dashboard", async (req, res) => {
  try {
    // For public access, you may want to fetch a default student or by query param
    // Here, just fetch the first student for demo (customize as needed)
    const student = await Student.findOne();
    const tasks = await Task.find({ assignedTo: student?._id });
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
    let filter = {};
    if (update.userId) {
      filter = { userId: update.userId };
    }
    let student = await Student.findOneAndUpdate(filter, update, { new: true });
    if (!student) {
      // If no student exists, create a new one
      student = new Student(update);
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
