const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/auth");

const User = require("../models/User");
const Task = require("../models/Task");
const Certificate = require("../models/Certificate");

// Development-only: create a default admin user (only when not in production)
router.post("/create-default-admin", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Not allowed in production" });
    }

    const { email = "hubinity@gmail.com", password = "Hubinity@1234" } =
      req.body || {};

    let user = await User.findOne({ email });
    if (user) {
      if (user.userType !== "admin") {
        user.userType = "admin";
        await user.save();
      }
      return res.json({ message: "Admin already exists", user: { email: user.email } });
    }

    user = new User({
      email,
      password,
      userType: "admin",
      firstName: "Hubinity",
      lastName: "Admin",
    });
    await user.save();
    return res.status(201).json({ message: "Admin user created", user: { email: user.email } });
  } catch (err) {
    console.error("Error creating default admin:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// middleware: ensure admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  next();
};

// GET /api/admin/dashboard/student/:id
// Returns { user, tasks, certificates }
router.get(
  "/dashboard/student/:id",
  verifyJWT,
  requireAdmin,
  async (req, res) => {
    try {
      const studentId = req.params.id;
      const user = await User.findById(studentId).select("-password");
      if (!user) return res.status(404).json({ error: "User not found" });

      // Tasks assigned to this student
      const assignedTasks = await Task.find({ assignedStudent: studentId })
        .populate("assignedStudent", "firstName lastName email username")
        .populate({ path: "startup", select: "companyName email", model: "User" })
        .populate("submissions.student", "firstName lastName email username");

      // Tasks where this student has submissions
      const submittedTasks = await Task.find({ "submissions.student": studentId })
        .populate("assignedStudent", "firstName lastName email username")
        .populate({ path: "startup", select: "companyName email", model: "User" })
        .populate("submissions.student", "firstName lastName email username");

      // Merge and dedupe
      const allTasksMap = {};
      [...assignedTasks, ...submittedTasks].forEach((t) => {
        allTasksMap[t._id.toString()] = t;
      });
      const tasks = Object.values(allTasksMap);

      const certificates = await Certificate.find({ student: studentId })
        .populate({ path: "startup", select: "companyName", model: "User" })
        .populate("task", "title");

      res.json({ user, tasks, certificates });
    } catch (err) {
      console.error("/api/admin/dashboard/student error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/admin/dashboard/startup/:id
// Returns { startup, tasks }
router.get(
  "/dashboard/startup/:id",
  verifyJWT,
  requireAdmin,
  async (req, res) => {
    try {
      const startupId = req.params.id;
      const startup = await User.findById(startupId).select("-password");
      if (!startup) return res.status(404).json({ error: "Startup not found" });

      // Fetch tasks posted by this startup and populate submissions
      const tasks = await Task.find({ startup: startupId })
        .populate("assignedStudent", "firstName lastName email username")
        .populate({ path: "startup", select: "companyName email", model: "User" })
        .populate("submissions.student", "firstName lastName email username")
        .sort({ createdAt: -1 });

      // Ensure submissions.student is populated for any string ids
      for (let task of tasks) {
        if (task.submissions && task.submissions.length > 0) {
          for (let submission of task.submissions) {
            if (submission.student && typeof submission.student === "string") {
              try {
                const s = await User.findById(submission.student).select(
                  "firstName lastName email username"
                );
                submission.student = s || submission.student;
              } catch (e) {
                // ignore
              }
            }
          }
        }
      }

      res.json({ startup, tasks });
    } catch (err) {
      console.error("/api/admin/dashboard/startup error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
