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

// GET /api/users/:id - Get specific user by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
