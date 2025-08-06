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
    const tasks = await Task.find({ startup: req.user.id }).populate(
      "assignedStudent",
      "firstName lastName email username"
    );
    res.json({ startup, tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get notifications for startup
router.get("/notifications", verifyJWT, async (req, res) => {
  const Notification = require("../models/Notification");
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "sender",
        select: "firstName lastName companyName username email",
      });
    // Map sender to display name
    const notificationsWithName = notifications.map((notif) => {
      let senderName = "";
      if (notif.sender) {
        if (notif.sender.firstName || notif.sender.lastName) {
          senderName = `${notif.sender.firstName || ""} ${
            notif.sender.lastName || ""
          }`.trim();
        } else if (notif.sender.companyName) {
          senderName = notif.sender.companyName;
        } else if (notif.sender.username) {
          senderName = notif.sender.username;
        } else if (notif.sender.email) {
          senderName = notif.sender.email;
        } else {
          senderName = notif.sender._id;
        }
      }
      return { ...notif.toObject(), senderName };
    });
    res.json(notificationsWithName);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Mark a notification as read for startup
router.patch("/notifications/:id/read", verifyJWT, async (req, res) => {
  const Notification = require("../models/Notification");
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notif)
      return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Post new task
router.post("/tasks", verifyJWT, async (req, res) => {
  try {
    const task = new Task({ ...req.body, startup: req.user.id });
    await task.save();

    // If assignedStudent exists, create notification for student
    if (task.assignedStudent) {
      const Notification = require("../models/Notification");
      const notif = new Notification({
        recipient: task.assignedStudent,
        sender: req.user.id,
        type: "task-assigned",
        message: `You have been assigned a new task: ${task.title}`,
        link: "/tasks",
      });
      await notif.save();
    }

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
    // Find the student and get their userId
    const Student = require("../models/Student");
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    // Use the userId (User _id) for assignedStudent
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { assignedStudent: student.userId, status: "assigned" },
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
