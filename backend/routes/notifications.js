import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

// Helper: get current user ID from session
const getCurrentUserId = (req) => {
  return req.session.user?.id || req.session.student?.id || req.session.teacher?.id;
};

// Get all notifications for current user
router.get("/", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Error fetching notifications", error: err.message });
  }
});

// Get unread notifications count
router.get("/unread-count", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const count = await Notification.countDocuments({ userId, isRead: false });
    res.json({ unreadCount: count });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ message: "Error fetching unread count", error: err.message });
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const notification = await Notification.findOne({ _id: req.params.id, userId });
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    await notification.markAsRead();
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: "Error marking notification as read", error: err.message });
  }
});

// Mark all notifications as read
router.put("/mark-all-read", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ message: "Error marking all notifications as read", error: err.message });
  }
});

// Delete notification
router.delete("/:id", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId });
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ message: "Error deleting notification", error: err.message });
  }
});

export default router;
