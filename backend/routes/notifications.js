import express from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

const router = express.Router();

// Check if MongoDB is available
const isMongoDBAvailable = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

// Get all notifications for authenticated user
router.get("/", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const notifications = await Notification.find({ 
      userId: req.session.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await notification.markAsRead();

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.put("/read-all", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const result = await Notification.updateMany(
      { 
        userId: req.session.user.id,
        isRead: false 
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ 
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
});

// Delete notification
router.delete("/:id", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

// Get unread notification count
router.get("/unread/count", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const count = await Notification.countDocuments({
      userId: req.session.user.id,
      isRead: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Failed to get unread count" });
  }
});

// Create notification (for internal use)
router.post("/", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { userId, type, title, message, priority, relatedId, relatedModel, actionUrl } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      priority: priority || "medium",
      relatedId,
      relatedModel,
      actionUrl
    });

    await notification.save();

    res.status(201).json({ 
      message: "Notification created successfully",
      notification 
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

export default router;
