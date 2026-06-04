import express from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
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

// Get all bookings for authenticated user
router.get("/", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    let bookings;
    if (req.session.user.role === "student") {
      bookings = await Booking.find({ studentId: req.session.user.id })
        .populate("teacherId", "fullName email subjects hourlyRate")
        .sort({ createdAt: -1 });
    } else if (req.session.user.role === "teacher") {
      bookings = await Booking.find({ teacherId: req.session.user.id })
        .populate("studentId", "fullName email grade")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// Get available teachers for booking
router.get("/teachers", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view teachers" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const teachers = await Teacher.find({ isActive: true }, { password: 0 })
      .select("fullName email subjects qualifications experience hourlyRate bio availability");

    // Add availability status
    const teachersWithStatus = teachers.map(teacher => ({
      ...teacher.toObject(),
      availability: "available" // Simplified for now
    }));

    res.json({ teachers: teachersWithStatus });
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
});

// Get student's bookings
router.get("/student/bookings", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view their bookings" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const bookings = await Booking.find({ studentId: req.session.user.id })
      .populate("teacherId", "fullName email subjects")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error("Get student bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// Create new booking
router.post("/book", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can create bookings" });
    }

    const { teacherId, subject, message, scheduledDate } = req.body;

    if (!teacherId || !subject) {
      return res.status(400).json({ message: "Teacher ID and subject are required" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Create booking
    const booking = new Booking({
      studentId: req.session.user.id,
      teacherId,
      subject,
      message: message || "",
      startTime: scheduledDate ? new Date(scheduledDate) : new Date(),
      endTime: scheduledDate ? new Date(new Date(scheduledDate).getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000),
      status: "pending",
      price: teacher.hourlyRate || 0
    });

    await booking.save();

    // Create notification for teacher
    const notification = new Notification({
      userId: teacherId,
      type: "booking",
      title: "New Booking Request",
      message: `You have a new booking request for ${subject} from ${req.session.user.name}`,
      relatedId: booking._id,
      relatedModel: "Booking",
      priority: "high"
    });

    await notification.save();

    res.status(201).json({
      message: "Booking request sent successfully",
      booking
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Failed to create booking" });
  }
});

// Accept booking
router.put("/:id/accept", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can accept bookings" });
    }

    const { meetingLink } = req.body;

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.teacherId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only accept your own bookings" });
    }

    booking.status = "confirmed";
    if (meetingLink) {
      booking.meetingLink = meetingLink;
    }
    await booking.save();

    // Create notification for student
    const notification = new Notification({
      userId: booking.studentId,
      type: "booking",
      title: "Booking Confirmed",
      message: `Your booking for ${booking.subject} has been confirmed`,
      relatedId: booking._id,
      relatedModel: "Booking",
      priority: "medium"
    });

    await notification.save();

    res.json({ message: "Booking accepted", booking });
  } catch (error) {
    console.error("Accept booking error:", error);
    res.status(500).json({ message: "Failed to accept booking" });
  }
});

// Reject booking
router.put("/:id/reject", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can reject bookings" });
    }

    const { reason } = req.body;

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.teacherId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only reject your own bookings" });
    }

    booking.status = "rejected";
    if (reason) {
      booking.notes = reason;
    }
    await booking.save();

    // Create notification for student
    const notification = new Notification({
      userId: booking.studentId,
      type: "booking",
      title: "Booking Rejected",
      message: `Your booking for ${booking.subject} has been rejected${reason ? ': ' + reason : ''}`,
      relatedId: booking._id,
      relatedModel: "Booking",
      priority: "medium"
    });

    await notification.save();

    res.json({ message: "Booking rejected", booking });
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(500).json({ message: "Failed to reject booking" });
  }
});

// Complete booking
router.put("/:id/complete", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can complete sessions" });
    }

    const { sessionNotes } = req.body;

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.teacherId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only complete your own sessions" });
    }

    booking.status = "completed";
    booking.isCompleted = true;
    booking.completedAt = new Date();
    if (sessionNotes) {
      booking.sessionNotes = sessionNotes;
    }
    await booking.save();

    // Create notification for student
    const notification = new Notification({
      userId: booking.studentId,
      type: "booking",
      title: "Session Completed",
      message: `Your session for ${booking.subject} has been completed`,
      relatedId: booking._id,
      relatedModel: "Booking",
      priority: "medium"
    });

    await notification.save();

    res.json({ message: "Session completed", booking });
  } catch (error) {
    console.error("Complete session error:", error);
    res.status(500).json({ message: "Failed to complete session" });
  }
});

// Rate a completed session (student side)
router.post("/:id/rate", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can rate sessions" });
    }

    const { rating, feedback } = req.body;

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.studentId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only rate your own sessions" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "You can only rate completed sessions" });
    }

    booking.rating = rating;
    if (typeof feedback === "string") {
      booking.feedback = feedback;
    }

    await booking.save();

    res.json({ message: "Rating saved", booking });
  } catch (error) {
    console.error("Rate session error:", error);
    res.status(500).json({ message: "Failed to save rating" });
  }
});

// Get recordings
router.get("/recordings", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    let bookings;
    if (req.session.user.role === "student") {
      bookings = await Booking.find({ 
        studentId: req.session.user.id,
        status: "completed",
        recordingUrl: { $exists: true, $ne: null }
      })
      .populate("teacherId", "fullName email")
      .sort({ completedAt: -1 });
    } else if (req.session.user.role === "teacher") {
      bookings = await Booking.find({ 
        teacherId: req.session.user.id,
        status: "completed",
        recordingUrl: { $exists: true, $ne: null }
      })
      .populate("studentId", "fullName email")
      .sort({ completedAt: -1 });
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ recordings: bookings });
  } catch (error) {
    console.error("Fetch recordings error:", error);
    res.status(500).json({ message: "Failed to fetch recordings" });
  }
});

// Get specific booking
router.get("/:id", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("studentId", "fullName email")
      .populate("teacherId", "fullName email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user has access to this booking
    if (req.session.user.role === "student" && booking.studentId._id.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (req.session.user.role === "teacher" && booking.teacherId._id.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ booking });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
});

// Get teacher's materials
router.get("/teacher/:teacherId/materials", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const StudyMaterial = (await import("../models/StudyMaterial.js")).default;
    const materials = await StudyMaterial.find({ 
      uploadedBy: req.params.teacherId,
      isPublic: true 
    })
    .populate("uploadedBy", "fullName email")
    .sort({ createdAt: -1 });

    res.json({ materials });
  } catch (error) {
    console.error("Get teacher materials error:", error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

export default router;
