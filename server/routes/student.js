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

    const tasks = await Task.find({ assignedStudent: userId })
      .populate("assignedStudent", "firstName lastName email username")
      .populate({
        path: "startup",
        select: "companyName email",
        model: "User",
      });

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

    // Ensure full startup document is populated for companyName (now from User model)
    const task = await Task.findById(req.params.taskId).populate({
      path: "startup",
      select: "companyName firstName lastName email",
      model: "User",
    });
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

    // Save submission as a deliverable
    task.deliverables.push({
      name: `Link Submission`,
      description: `Student submitted a link`,
      fileUrl: link,
      submittedAt: new Date(),
      isApproved: false,
    });

    // Mark task as completed
    task.status = "completed";
    task.completedAt = new Date();
    await task.save();

    // Generate certificate automatically - Check if certificate already exists
    try {
      console.log("Starting certificate generation for task:", task._id);

      // Check if certificate already exists for this task
      const existingCertificate = await Certificate.findOne({
        student: req.user.id,
        task: task._id,
      });

      if (existingCertificate) {
        console.log(
          "Certificate already exists for this task, skipping generation"
        );
        return;
      }

      const user = await User.findById(req.user.id);
      console.log("User found:", user._id);

      // Get proper student name
      let studentName = "Student";
      if (user.firstName && user.lastName) {
        studentName = `${user.firstName} ${user.lastName}`;
      } else if (user.firstName) {
        studentName = user.firstName;
      } else if (user.lastName) {
        studentName = user.lastName;
      } else if (user.username) {
        studentName = user.username;
      } else if (user.email) {
        studentName = user.email.split("@")[0]; // Use email prefix as name
      }

      // Better startup name retrieval
      let startupName = "Unknown Company";
      if (task.startup) {
        if (task.startup.companyName && task.startup.companyName.trim()) {
          startupName = task.startup.companyName.trim();
        } else if (task.startup.firstName && task.startup.lastName) {
          startupName = `${task.startup.firstName} ${task.startup.lastName}`;
        } else if (task.startup.firstName && task.startup.firstName.trim()) {
          startupName = task.startup.firstName.trim();
        } else if (task.startup.email) {
          startupName = task.startup.email.split("@")[0]; // Use email prefix as company name
        }
      }

      // If still unknown, try to get from task metadata or use a generic name
      if (
        startupName === "Unknown Company" ||
        !startupName ||
        startupName.trim() === ""
      ) {
        startupName = "Unknown Company";
      }

      console.log("Student name:", studentName);
      console.log("Startup name:", startupName);

      const certificateData = {
        studentName,
        taskTitle: task.title,
        startupName,
        completionDate: task.completedAt,
        certificateNumber: `HUB-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`,
        skills: task.skills || [],
      };

      console.log("Certificate data:", certificateData);

      const certificateFile = await certificateGenerator.generateCertificate(
        certificateData
      );
      console.log("Certificate file generated:", certificateFile);

      // Create certificate record in database
      const certificate = new Certificate({
        student: req.user.id,
        startup: task.startup?._id,
        task: task._id,
        title: task.title,
        description: `Certificate for completing ${task.title}`,
        skills: task.skills,
        certificateNumber: certificateData.certificateNumber,
        issuedAt: new Date(),
        pdfUrl: `/api/student/certificates/${certificateFile.filename}`,
        metadata: {
          taskTitle: task.title,
          taskCategory: task.category,
          completionDate: task.completedAt,
          hoursWorked: task.estimatedHours || 0,
        },
      });

      await certificate.save();
      console.log("Certificate saved to database:", certificate._id);

      // Add certificate to user's certificates array
      if (!user.certificates) user.certificates = [];
      user.certificates.push(certificate._id);
      await user.save();
      console.log("Certificate added to user profile");

      // Create notification for certificate generation
      const notification = new Notification({
        recipient: req.user.id,
        sender: task.startup?._id,
        type: "certificate",
        message: `Congratulations! Your certificate for "${task.title}" has been generated.`,
        link: "/certificates",
        read: false,
      });
      await notification.save();
      console.log("Notification created for certificate");

      console.log(
        `Certificate generated successfully for task ${task._id}: ${certificateFile.filename}`
      );
    } catch (certError) {
      console.error("Error generating certificate:", certError);
      console.error("Error stack:", certError.stack);
      // Don't fail the task submission if certificate generation fails
    }

    res.json({
      message: "Link submitted successfully and certificate generated",
    });
  } catch (err) {
    console.error("Error in task submission:", err);
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
        return res.status(404).json({ error: "Certificate file not found" });
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
    const tasks = await Task.find({})
      .populate("assignedStudent", "firstName lastName username email")
      .populate({
        path: "startup",
        select: "companyName firstName lastName email",
        model: "User",
      });

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
