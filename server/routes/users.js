// server/routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET /api/users?role=student
router.get("/", async (req, res) => {
  try {
    console.log("/api/users req.query:", req.query);
    const { role } = req.query;
    const query = {};
    if (role) query.userType = role;
    console.log("/api/users query:", query);
    const users = await User.find(query).select("-password");
    console.log("/api/users result count:", users.length);
    if (users.length > 0) {
      console.log("First user:", users[0]);
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
