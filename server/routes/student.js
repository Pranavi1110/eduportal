const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { verifyJWT } = require("../middleware/auth");

const User = require("../models/User");
const Task = require("../models/Task");
const Certificate = require("../models/Certificate");
const Notification = require("../models/Notification");
const certificateGenerator = require("../services/certificateGenerator");

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
          senderName = `${notif.sender.firstName || ""} ${
            notif.sender.lastName || ""
          }`.trim();
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

    // Get tasks assigned to this student
    const assignedTasks = await Task.find({ assignedStudent: userId })
      .populate("assignedStudent", "firstName lastName email username")
      .populate({
        path: "startup",
        select: "companyName email",
        model: "User",
      });

    // Get tasks where this student has submissions (including rejected ones)
    const submittedTasks = await Task.find({
      "submissions.student": userId
    })
      .populate("assignedStudent", "firstName lastName email username")
      .populate({
        path: "startup",
        select: "companyName email",
        model: "User",
      })
      .populate("submissions.student", "firstName lastName email username");

    // Combine and deduplicate tasks
    const allTasks = [...assignedTasks];
    submittedTasks.forEach(submittedTask => {
      if (!allTasks.find(task => task._id.toString() === submittedTask._id.toString())) {
        allTasks.push(submittedTask);
      }
    });

    const tasks = allTasks;

    console.log(
      "[DEBUG] /student/dashboard userId:",
      user._id.toString(),
      "tasks found:",
      tasks.length
    );
    
    // Debug: Log task details
    tasks.forEach((task, index) => {
      console.log(`[DEBUG] Task ${index + 1}:`, {
        id: task._id,
        title: task.title,
        status: task.status,
        assignedStudent: task.assignedStudent?._id,
        submissions: task.submissions?.map(s => ({
          student: s.student?._id || s.student,
          status: s.status
        }))
      });
    });

    res.json({ user, tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔒 Submit a link for a task (for assigned student)
router.post("/tasks/:taskId/submit-link", verifyJWT, async (req, res) => {
  try {
    console.log("=== TASK SUBMISSION START ===");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    console.log("Current user:", req.user.id);
    
    const { link } = req.body;
    if (!link) return res.status(400).json({ error: "Link is required" });

    console.log("Finding task with ID:", req.params.taskId);
    
    // First, let's check if the task exists without population
    const rawTask = await Task.findById(req.params.taskId);
    console.log("Raw task found:", rawTask ? "YES" : "NO");
    if (rawTask) {
      console.log("Raw task details:", {
        id: rawTask._id,
        title: rawTask.title,
        status: rawTask.status,
        startupId: rawTask.startup,
        startupType: typeof rawTask.startup,
        submissionsCount: rawTask.submissions ? rawTask.submissions.length : 0
      });
    }
    
    // Find the task and populate the startup field from User model
    const task = await Task.findById(req.params.taskId).populate({
      path: "startup",
      select: "companyName firstName lastName email",
      model: "User",
    });
    
    console.log("Task found:", task ? "YES" : "NO");
    if (task) {
      console.log("Task details:", {
        id: task._id,
        title: task.title,
        status: task.status,
        startup: task.startup ? {
          id: task.startup._id,
          name: task.startup.companyName || task.startup.firstName
        } : "NULL"
      });
    }
    
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    // Check if startup exists
    if (!task.startup) {
      console.error("Task startup not found for task:", req.params.taskId);
      return res.status(400).json({ error: "Task startup information not found" });
    }
    
    console.log("Startup found:", {
      id: task.startup._id,
      name: task.startup.companyName || task.startup.firstName,
      email: task.startup.email
    });

    // Allow any student to submit for any task
    // Prevent duplicate submissions by same student for same task
    console.log("Checking for duplicate submissions. Current user:", req.user.id, "Existing submissions:", task.submissions.map(s => s.student.toString()));
    
    if (task.submissions.some(s => s.student.toString() === req.user.id)) {
      return res.status(400).json({ error: "You have already submitted for this task." });
    }

    console.log("No duplicate submissions found. Adding new submission...");

    // Add submission to submissions array as pending
    task.submissions.push({
      student: req.user.id,
      link,
      submittedAt: new Date(),
      status: "pending"
    });
    
    // Update task status to submitted if it was open
    if (task.status === "open") {
      task.status = "submitted";
      console.log("Task status updated from 'open' to 'submitted'");
    }
    
    console.log("Saving task with new submission...");
    await task.save();
    console.log("Task saved successfully");
    
    // Notify startup about new submission
    console.log("Creating notification for startup:", task.startup._id, "from student:", req.user.id);
    
    try {
      const notification = new Notification({
        recipient: task.startup._id,
        sender: req.user.id,
        type: "task",
        message: `New submission received for task: ${task.title}`,
        link: `/startup/tasks/${task._id}`,
        read: false,
      });
      
      console.log("Notification object created:", notification);
      await notification.save();
      console.log("Notification saved successfully:", notification._id);
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Don't fail the entire submission if notification fails
      // The task submission was successful
    }
    
    console.log("=== TASK SUBMISSION SUCCESS ===");
    
    // Send success response
    return res.json({
      message: "Link submitted successfully and pending approval.",
      success: true,
      taskId: task._id
    });
  } catch (err) {
    console.error("=== TASK SUBMISSION ERROR ===");
    console.error("Error in task submission:", err);
    console.error("Error stack:", err.stack);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    return res.status(500).json({ error: "Server error", details: err.message });
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

// 🔒 Download certificate PDF
router.get(
  "/certificates/:certificateId/download",
  verifyJWT,
  async (req, res) => {
    try {
      console.log(
        "Download request for certificate:",
        req.params.certificateId
      );

      const certificate = await Certificate.findById(req.params.certificateId);
      if (!certificate) {
        console.log("Certificate not found in database");
        return res.status(404).json({ error: "Certificate not found" });
      }

      // Check if user owns this certificate
      if (certificate.student.toString() !== req.user.id) {
        console.log("User not authorized to download this certificate");
        return res
          .status(403)
          .json({ error: "Not authorized to download this certificate" });
      }

      const filename = `certificate_${certificate.certificateNumber}.pdf`;
      const filepath = path.join(__dirname, "../certificates", filename);

      console.log("Looking for certificate file at:", filepath);

      if (!fs.existsSync(filepath)) {
        console.log("Certificate file not found on disk");
        // Try to serve via static route as fallback
        const staticUrl = `/api/certificates/${filename}`;
        console.log("Redirecting to static URL:", staticUrl);
        return res.redirect(staticUrl);
      }

      console.log("Certificate file found, sending download");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      const fileStream = fs.createReadStream(filepath);
      fileStream.pipe(res);
    } catch (err) {
      console.error("Error downloading certificate:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/tasks/all", verifyJWT, async (req, res) => {
  try {
    const { status, category, startup } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (startup) {
      query.startup = startup;
    }
    
    const tasks = await Task.find(query)
      .populate("assignedStudent", "firstName lastName username email")
      .populate({
        path: "startup",
        select: "companyName firstName lastName email",
        model: "User",
      })
      .populate("submissions.student", "firstName lastName email username")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error("Error fetching all tasks:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔒 Get all certificates for current user
router.get("/certificates", verifyJWT, async (req, res) => {
  try {
    console.log("Fetching certificates for user:", req.user.id);

    const certificates = await Certificate.find({ student: req.user.id })
      .populate({
        path: "startup",
        select: "companyName firstName lastName",
        model: "User",
      })
      .populate("task", "title category skills")
      .sort({ issuedAt: -1 });

    console.log("Found certificates:", certificates.length);
    res.json(certificates);
  } catch (err) {
    console.error("Error fetching certificates:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
