const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who triggered the notification
  type: { type: String, enum: ["message", "task-assigned", "task", "certificate"], required: true },
  message: { type: String, required: true },
  link: { type: String }, // optional link to related resource (e.g., task, chat)
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
