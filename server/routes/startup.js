const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/auth");
const Task = require("../models/Task");
const Student = require("../models/Student");
const Certificate = require("../models/Certificate");
const User = require("../models/User");

// Update startup profile
router.put("/profile", verifyJWT, async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate(
      { _id: req.user.id, userType: "startup" },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get startup dashboard data (tasks, notifications, profile)
router.get("/dashboard", verifyJWT, async (req, res) => {
  try {
    const startup = await User.findOne({
      _id: req.user.id,
      userType: "startup",
    });
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
    const query = { userType: "student" };
    if (filters.skills) {
      const skillsArr = filters.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillsArr.length === 1) {
        query["skills.name"] = { $regex: skillsArr[0], $options: "i" };
      } else if (skillsArr.length > 1) {
        query["$or"] = skillsArr.map((skill) => ({
          "skills.name": { $regex: skill, $options: "i" },
        }));
      }
    }
    const students = await User.find(query);
    res.json(students);
  } catch (err) {
    console.error("ERROR DEBUG", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Assign task to student
router.post("/tasks/:taskId/assign", verifyJWT, async (req, res) => {
  try {
    const { studentId } = req.body;
    const Student = require("../models/Student");
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
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

    const submission = task.submissions.find(
      (s) => s.student.toString() === studentId
    );
    if (!submission)
      return res.status(404).json({ error: "Submission not found" });

    submission.status = approve ? "approved" : "rejected";
    await task.save();

    // Only on approval: mark task as completed, generate certificate, notify student
    if (approve) {
      // Mark task as completed for this student
      task.status = "completed";
      task.completedAt = new Date();
      await task.save();

      // Generate certificate
      const studentId = submission.student;
      const student = await require("../models/User").findById(studentId);
      const Certificate = require("../models/Certificate");
      const certificateGenerator = require("../services/certificateGenerator");
      let studentName = student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : (student.firstName || student.lastName || student.username || student.email.split("@")[0] || "Student");
      let startupName = task.startup?.companyName || task.startup?.firstName || task.startup?.email?.split("@")[0] || "Unknown Company";
      const certificateData = {
        studentName,
        taskTitle: task.title,
        startupName,
        completionDate: task.completedAt,
        certificateNumber: `HUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        skills: task.skills || [],
      };
      const certificateFile = await certificateGenerator.generateCertificate(certificateData);
      const certificate = new Certificate({
        student: studentId,
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
      if (!student.certificates) student.certificates = [];
      student.certificates.push(certificate._id);
      await student.save();

      // Create notification for certificate generation
      const Notification = require("../models/Notification");
      const notification = new Notification({
        recipient: studentId,
        sender: task.startup?._id,
        type: "certificate",
        message: `Congratulations! Your certificate for "${task.title}" has been generated.`,
        link: "/certificates",
        read: false,
      });
      await notification.save();
    } else {
      // If rejected, notify student
      const Notification = require("../models/Notification");
      const notification = new Notification({
        recipient: submission.student,
        sender: task.startup?._id,
        type: "task",
        message: `Your submission for "${task.title}" was rejected by the startup."`,
        link: "/tasks",
        read: false,
      });
      await notification.save();
    }
    res.json({ message: approve ? "Task approved and certificate generated" : "Task rejected and student notified" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all startups
router.get("/all", async (req, res) => {
  try {
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

// Get startup names
router.get("/names", async (req, res) => {
  try {
    const startups = await User.find(
      { userType: "startup" },
      "_id companyName"
    );
    res.json(startups);
  } catch (error) {
    console.error("Error fetching startup names:", error);
    res.status(500).json({ message: "Failed to fetch startup names" });
  }
});

module.exports = router;
