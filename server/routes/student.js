const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/auth");

const User = require("../models/User");
const Task = require("../models/Task");
const Certificate = require("../models/Certificate");
const Notification = require("../models/Notification");

// 🔒 Mark a notification as read
router.patch("/notifications/:id/read", verifyJWT, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notif)
      return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔒 Get notifications for logged-in student (User model)
router.get("/notifications", verifyJWT, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "firstName lastName companyName username email");

    const notificationsWithName = notifications.map((notif) => {
      let senderName = "";

      if (notif.sender) {
        if (notif.sender.companyName) {
          senderName = notif.sender.companyName;
        } else if (notif.sender.firstName || notif.sender.lastName) {
          senderName = `${notif.sender.firstName || ""} ${notif.sender.lastName || ""}`.trim();
        } else if (notif.sender.username) {
          senderName = notif.sender.username;
        } else if (notif.sender.email) {
          senderName = notif.sender.email;
        } else {
          senderName = notif.sender._id.toString();
        }
      }

      let message = notif.message;
      if (notif.type === "message") {
        message = `New message from ${senderName}`;
      }

      return {
        ...notif.toObject(),
        senderName,
        message,
      };
    });

    res.json(notificationsWithName);
  } catch (err) {
    console.error("[ERROR] Failed to fetch student notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Create or update student profile (User model)
router.post("/profile", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const profileFields = { ...req.body };
    delete profileFields._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: profileFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// 🔒 Get login details for current user (excluding password)
router.get("/login-details", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔒 Get student dashboard data (tasks assigned to this user)
router.get("/dashboard", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const tasks = await Task.find({ assignedStudent: userId }).populate(
      "assignedStudent",
      "firstName lastName email username"
    );

    console.log(
      "[DEBUG] /student/dashboard userId:",
      user._id.toString(),
      "tasks found:",
      tasks.length
    );

    res.json({ user, tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔒 Submit a task (adds submission to Task model)
// 🔒 Submit a link for a task (for assigned student)
router.post("/tasks/:taskId/submit-link", verifyJWT, async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) return res.status(400).json({ error: "Link is required" });

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Only assigned student can submit
    if (
      !task.assignedStudent ||
      task.assignedStudent.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to submit for this task" });
    }

    // Save submission as a deliverable (or add a submissions array if needed)
    task.deliverables.push({
      name: `Link Submission`,
      description: `Student submitted a link`,
      fileUrl: link,
      submittedAt: new Date(),
      isApproved: false,
    });
    // Mark task as completed
    task.status = "completed";
    await task.save();
    res.json({ message: "Link submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔒 Edit student profile (User model)
router.put("/profile", async (req, res) => {
  try {
    const update = req.body;
    if (!update.userId)
      return res.status(400).json({ error: "userId is required" });

    let user = await User.findByIdAndUpdate(update.userId, update, {
      new: true,
    });

    if (!user) {
      user = new User({ ...update, _id: update.userId });
      await user.save();
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// 🔒 Get badges and certificates from User model
router.get("/badges-certificates", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("certificates");

    res.json({
      badges: user.badges || [],
      certificates: user.certificates || [],
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
