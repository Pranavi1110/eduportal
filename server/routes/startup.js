// Startup routes for dashboard, tasks, students, approvals, notifications, chat
const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/auth");
const Startup = require("../models/Startup");
const Task = require("../models/Task");
const Student = require("../models/Student");
const Certificate = require("../models/Certificate");
const User = require("../models/User");
// Update startup profile
router.put("/profile", verifyJWT, async (req, res) => {
  try {
    const updated = await Startup.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get startup dashboard data (tasks, notifications, profile)
router.get("/dashboard", verifyJWT, async (req, res) => {
  try {
    const startup = await Startup.findById(req.user.id);
    const tasks = await Task.find({ startup: req.user.id });
    // TODO: Fetch notifications
    res.json({ startup, tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Post new task
router.post("/tasks", verifyJWT, async (req, res) => {
  try {
    const task = new Task({ ...req.body, startup: req.user.id });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// View all students with filters
router.get("/students", verifyJWT, async (req, res) => {
  try {
    const filters = req.query;
    // Example: filter by skills, badges, work experience
    const query = {};
    if (filters.skills)
      query["skills.name"] = { $in: filters.skills.split(",") };
    if (filters.badges)
      query["badges.name"] = { $in: filters.badges.split(",") };
    // TODO: Add work experience filter
    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Assign task to student
router.post("/tasks/:taskId/assign", verifyJWT, async (req, res) => {
  try {
    const { studentId } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { assignedStudent: studentId, status: "assigned" },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Approve or reject task submission
router.post("/tasks/:taskId/approve", verifyJWT, async (req, res) => {
  try {
    const { studentId, approve } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    // Find submission
    const submission = task.submissions.find(
      (s) => s.student.toString() === studentId
    );
    if (!submission)
      return res.status(404).json({ error: "Submission not found" });
    submission.status = approve ? "approved" : "rejected";
    await task.save();
    // TODO: Generate certificate, notify student, send email
    res.json({ message: approve ? "Task approved" : "Task rejected" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
 // or the correct path to Startup model
router.get("/all", async (req, res) => {
  try {
    // Pull startup users and select only needed fields
    const startups = await User.find(
      { userType: "startup" },
      "_id companyName email"
    );

    res.json(startups);
  } catch (error) {
    console.error("Error fetching startups:", error);
    res.status(500).json({ message: "Failed to fetch startups" });
  }
});

router.get("/names", async (req, res) => {
  try {
    const startups = await Startup.find({}, "_id companyName");
    console.log(startups);
    res.json(startups); // Array of { _id, companyName }
  } catch (error) {
    console.error("Error fetching startup names:", error);
    res.status(500).json({ message: "Failed to fetch startup names" });
  }
});

module.exports = router;
