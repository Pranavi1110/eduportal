const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/auth");
const Message = require("../models/Message");
const User = require("../models/User");

// Get all users the current user has chatted with
router.get("/conversations", verifyJWT, async (req, res) => {
  try {
    // Find all messages where the user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    });
    // Collect unique user IDs (other than self)
    const userIds = new Set();
    messages.forEach((msg) => {
      if (msg.sender.toString() !== req.user.id)
        userIds.add(msg.sender.toString());
      if (msg.receiver.toString() !== req.user.id)
        userIds.add(msg.receiver.toString());
    });
    // Fetch user details
    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select(
      "-password"
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Send a message
router.post("/send", verifyJWT, async (req, res) => {
  try {
    const { receiver, content, task } = req.body;
    if (!receiver || !content)
      return res.status(400).json({ error: "Receiver and content required" });
    const message = new Message({
      sender: req.user.id,
      receiver,
      content,
      task: task || undefined,
    });
    await message.save();

    // Create notification for receiver
    const Notification = require("../models/Notification");
    const receiverUser = await User.findById(receiver);
    if (receiverUser) {
      const notif = new Notification({
        recipient: receiver,
        sender: req.user.id,
        type: "message",
        message: `New message from ${req.user.id}`,
        link: `/chat/${req.user.id}`,
      });
      await notif.save();

      // If receiver is a startup, also create notification for startup dashboard
      if (receiverUser.userType === "startup") {
        const startupNotif = new Notification({
          recipient: receiver,
          sender: req.user.id,
          type: "message",
          message: `New message from ${req.user.id}`,
          link: `/chat/${req.user.id}`,
        });
        await startupNotif.save();
      }
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Get all messages between logged-in user and another user
router.get("/:userId", verifyJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
