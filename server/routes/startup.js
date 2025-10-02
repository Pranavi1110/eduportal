const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/auth");
const Task = require("../models/Task");
const Student = require("../models/Student");
const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Notification = require("../models/Notification");

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

// Get tasks posted by particular startup
router.get("/tasks", verifyJWT, async (req, res) => {
  try {
    console.log("Startup tasks request from user:", req.user.id);

    const { status, category } = req.query;
    let query = { startup: req.user.id };

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    console.log("Query:", query);

    let tasks = await Task.find(query)
      .populate("assignedStudent", "firstName lastName email username")
      .populate({ path: "startup", select: "companyName firstName lastName email profilePicture companyLogo" , model: "User" })
      .populate("submissions.student", "firstName lastName email username")
      .sort({ createdAt: -1 });

    console.log(`Found ${tasks.length} tasks for startup ${req.user.id}`);

    // Manually populate submissions.student for each task
    for (let task of tasks) {
      if (task.submissions && task.submissions.length > 0) {
        for (let submission of task.submissions) {
          if (submission.student && typeof submission.student === "string") {
            try {
              const student = await User.findById(submission.student).select(
                "firstName lastName email username"
              );
              submission.student = student;
            } catch (err) {
              console.error("Error populating student:", err);
            }
          }
        }
      }
    }

    // Debug: Check if submissions are properly populated
    if (tasks.length > 0) {
      console.log(
        "Sample task submissions:",
        JSON.stringify(tasks[0].submissions, null, 2)
      );
      if (tasks[0].submissions && tasks[0].submissions.length > 0) {
        console.log(
          "Sample submission student data:",
          JSON.stringify(tasks[0].submissions[0].student, null, 2)
        );
        console.log("Student type:", typeof tasks[0].submissions[0].student);
        console.log(
          "Student keys:",
          Object.keys(tasks[0].submissions[0].student || {})
        );
      }
    }

    return res.json(tasks);
  } catch (err) {
    console.error("Error fetching startup tasks:", err);
    return res
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
});

// Get notifications for startup
router.get("/notifications", verifyJWT, async (req, res) => {
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
    return res.json(notificationsWithName);
  } catch (err) {
    console.error("Error fetching startup notifications:", err);
    return res
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
});

// Mark a notification as read for startup
router.patch("/notifications/:id/read", verifyJWT, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notif)
      return res.status(404).json({ error: "Notification not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return res
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
});

// Post new work
router.post("/tasks", verifyJWT, async (req, res) => {
  try {
    // If frontend provided imageUrl, map it into attachments for compatibility
    const body = { ...req.body, startup: req.user.id };
    if (body.imageUrl && (!body.attachments || body.attachments.length === 0)) {
      body.attachments = [{ name: 'image', url: body.imageUrl }];
    }
    const task = new Task(body);
    await task.save();

    if (task.assignedStudent) {
      const notif = new Notification({
        recipient: task.assignedStudent,
        sender: req.user.id,
        type: "task-assigned",
        message: `You have been assigned new work: ${task.title}`,
        link: "/tasks",
      });
      await notif.save();
    }

    return res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err);
    return res
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
});

// View all students with filters
router.get("/students", verifyJWT, async (req, res) => {
  try {
    const filters = req.query;
    // Only return students, exclude admin and startup users
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
    const students = await User.find(query).select("-password");
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
    const { studentId, approve, reviewNotes } = req.body;

    console.log("Task approval request:", {
      taskId: req.params.taskId,
      studentId,
      approve,
      reviewNotes,
    });

    // Find task and populate startup field
    const task = await Task.findById(req.params.taskId).populate({
      path: "startup",
      select: "companyName firstName lastName email",
      model: "User",
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    console.log("Task found:", {
      taskId: task._id,
      startupId: task.startup?._id,
      currentUser: req.user.id,
    });

    // Check if startup exists
    if (!task.startup) {
      return res
        .status(400)
        .json({ error: "Task startup information not found" });
    }

    // Verify this startup owns the task
    if (task.startup._id.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to approve this task" });
    }

    console.log(
      "Looking for submission from student:",
      studentId,
      "Available submissions:",
      task.submissions.map((s) => ({
        student: s.student.toString(),
        status: s.status,
      }))
    );

    const submission = task.submissions.find(
      (s) => s.student.toString() === studentId
    );
    if (!submission)
      return res.status(404).json({ error: "Submission not found" });

    console.log("Submission found:", {
      studentId: submission.student.toString(),
      status: submission.status,
    });

    if (approve) {
      submission.status = "approved";
      submission.reviewedAt = new Date();
      submission.reviewNotes = reviewNotes || "";

      // Mark task as completed for this student
      task.status = "completed";
      task.completedAt = new Date();
      task.assignedStudent = studentId;

      await task.save();

      // Generate certificate
      const submissionStudentId = submission.student;
      const student = await User.findById(submissionStudentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      const certificateGenerator = require("../services/certificateGenerator");

      let studentName =
        student.firstName && student.lastName
          ? `${student.firstName} ${student.lastName}`
          : student.firstName ||
            student.lastName ||
            student.username ||
            student.email.split("@")[0] ||
            "Student";

      let startupName =
        task.startup.companyName ||
        task.startup.firstName ||
        task.startup.email?.split("@")[0] ||
        "Unknown Company";

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

      try {
        const certificateFile = await certificateGenerator.generateCertificate(
          certificateData
        );
        const certificate = new Certificate({
          student: submissionStudentId,
          startup: task.startup._id,
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
      } catch (certError) {
        console.error("Error generating certificate:", certError);
        // Continue with approval even if certificate generation fails
      }

      // Create notification for certificate generation
      try {
        const notification = new Notification({
          recipient: submissionStudentId,
          sender: task.startup._id,
          type: "certificate",
          message: `Congratulations! Your certificate for "${task.title}" has been generated.`,
          link: "/certificates",
          read: false,
        });
        await notification.save();
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Continue even if notification fails
      }
    } else {
      submission.status = "rejected";
      submission.reviewedAt = new Date();
      submission.reviewNotes = reviewNotes || "";

      console.log("Before status update - Task status:", task.status);
      console.log(
        "Before status update - All submissions:",
        task.submissions.map((s) => ({
          student: s.student.toString(),
          status: s.status,
        }))
      );

      // Update task status based on submission statuses
      const hasPending = task.submissions.some(
        (sub) => sub.status === "pending"
      );
      const hasUnderReview = task.submissions.some(
        (sub) => sub.status === "under-review"
      );
      const hasApproved = task.submissions.some(
        (sub) => sub.status === "approved"
      );
      const allRejected = task.submissions.every(
        (sub) => sub.status === "rejected"
      );

      console.log("Status checks:", {
        hasPending,
        hasUnderReview,
        hasApproved,
        allRejected,
      });

      if (hasApproved) {
        task.status = "completed";
      } else if (hasUnderReview) {
        task.status = "under-review";
      } else if (hasPending) {
        task.status = "submitted";
      } else if (allRejected) {
        task.status = "rejected";
      }

      console.log("After status update - Task status:", task.status);
      console.log(
        "Task status updated to:",
        task.status,
        "based on submissions:",
        task.submissions.map((s) => s.status)
      );

      await task.save();

      // If rejected, notify student
      try {
        console.log(
          "Creating rejection notification for student:",
          submission.student
        );
        const notification = new Notification({
          recipient: submission.student,
          sender: task.startup._id,
          type: "task",
          message: `Your submission for "${task.title}" was rejected by the startup.`,
          link: "/tasks",
          read: false,
        });
        await notification.save();
        console.log(
          "Rejection notification created successfully:",
          notification._id
        );
      } catch (notifError) {
        console.error("Error creating rejection notification:", notifError);
        // Continue even if notification fails
      }
    }

    // Send success response
    return res.json({
      message: approve
        ? "Task approved and certificate generated"
        : "Task rejected and student notified",
      success: true,
      taskId: task._id,
      studentId: studentId,
    });
  } catch (err) {
    console.error("Error in task approval:", err);
    return res
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
});

// Move submission to under review
router.post("/tasks/:taskId/review", verifyJWT, async (req, res) => {
  try {
    const { studentId } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const submission = task.submissions.find(
      (s) => s.student.toString() === studentId
    );
    if (!submission)
      return res.status(404).json({ error: "Submission not found" });

    submission.status = "under-review";
    await task.save();

    // Notify student that submission is under review
    try {
      const notification = new Notification({
        recipient: studentId,
        sender: task.startup?._id,
        type: "task",
        message: `Your submission for "${task.title}" is now under review.`,
        link: "/tasks",
        read: false,
      });
      await notification.save();
    } catch (notifError) {
      console.error("Error creating review notification:", notifError);
      // Continue even if notification fails
    }

    res.json({ message: "Submission moved to under review" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all startups
router.get("/all", async (req, res) => {
  try {
    // Return basic fields plus profilePicture so frontend can render logos
    const startups = await User.find(
      { userType: "startup" },
      "_id companyName email profilePicture companyLogo"
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
