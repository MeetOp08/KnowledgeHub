import express from "express";
import mongoose from "mongoose";
import Student from "../models/Student.js";
import Booking from "../models/Booking.js";
import StudyMaterial from "../models/StudyMaterial.js";

const router = express.Router();

// Check if MongoDB is available
const isMongoDBAvailable = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

// Get student dashboard data
router.get("/dashboard/data", async (req, res) => {
  try {
    console.log("📊 Student dashboard request received");
    console.log("Session:", req.session);
    
    if (!req.session.user) {
      console.log("❌ No session user found");
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.session.user.role !== "student") {
      console.log("❌ Role mismatch:", req.session.user.role);
      return res.status(403).json({ message: "Access denied" });
    }

    if (!isMongoDBAvailable()) {
      console.log("❌ MongoDB not available");
      return res.status(503).json({ message: "Database not available" });
    }

    console.log("🔍 Looking for student with ID:", req.session.user.id);
    const student = await Student.findById(req.session.user.id);
    if (!student) {
      console.log("❌ Student not found in database");
      return res.status(404).json({ message: "Student not found" });
    }
    
    console.log("✅ Student found:", student.email);

    const bookings = await Booking.find({ studentId: student._id })
      .populate("teacherId", "fullName email")
      .sort({ createdAt: -1 });

    const studyMaterials = await StudyMaterial.find({ isPublic: true })
      .populate("uploadedBy", "fullName email")
      .sort({ createdAt: -1 });

    const stats = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
      pendingBookings: bookings.filter(b => b.status === "pending").length,
      completedBookings: bookings.filter(b => b.status === "completed").length,
      totalMaterials: studyMaterials.length
    };

    const responseData = {
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        grade: student.grade,
        school: student.school,
        subjects: student.subjects,
        learningGoals: student.learningGoals
      },
      bookings,
      studyMaterials,
      stats
    };
    
    console.log("✅ Sending student dashboard data");
    res.json(responseData);
  } catch (error) {
    console.error("❌ Student dashboard error:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
});

// Update student profile
router.put("/profile", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can update their profile" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const student = await Student.findByIdAndUpdate(
      req.session.user.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Get student profile
router.get("/profile", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view their profile" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const student = await Student.findById(req.session.user.id).select("-password");
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Get student's bookings
router.get("/bookings", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view their bookings" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const bookings = await Booking.find({ studentId: req.session.user.id })
      .populate("teacherId", "fullName email subjects hourlyRate")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error("Get student bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// Get student's study materials
router.get("/materials", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view materials" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const materials = await StudyMaterial.find({ isPublic: true })
      .populate("uploadedBy", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ materials });
  } catch (error) {
    console.error("Get materials error:", error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

// Rate a completed session
router.post("/bookings/:bookingId/rate", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can rate sessions" });
    }

    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.studentId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only rate your own bookings" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Can only rate completed sessions" });
    }

    booking.rating = rating;
    if (feedback) {
      booking.feedback = feedback;
    }
    await booking.save();

    res.json({ message: "Rating submitted successfully", booking });
  } catch (error) {
    console.error("Rate session error:", error);
    res.status(500).json({ message: "Failed to submit rating" });
  }
});

// Cancel a booking
router.put("/bookings/:bookingId/cancel", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can cancel their bookings" });
    }

    const { reason } = req.body;

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.studentId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only cancel your own bookings" });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel completed sessions" });
    }

    booking.status = "cancelled";
    if (reason) {
      booking.notes = reason;
    }
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

export default router;
