import express from "express";
import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";
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

// Get teacher dashboard data
router.get("/dashboard/data", async (req, res) => {
  try {
    console.log("📊 Teacher dashboard request received");
    console.log("Session:", req.session);
    
    if (!req.session.user) {
      console.log("❌ No session user found");
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.session.user.role !== "teacher") {
      console.log("❌ Role mismatch:", req.session.user.role);
      return res.status(403).json({ message: "Access denied" });
    }

    if (!isMongoDBAvailable()) {
      console.log("❌ MongoDB not available");
      return res.status(503).json({ message: "Database not available" });
    }

    console.log("🔍 Looking for teacher with ID:", req.session.user.id);
    const teacher = await Teacher.findById(req.session.user.id);
    if (!teacher) {
      console.log("❌ Teacher not found in database");
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    console.log("✅ Teacher found:", teacher.email);

    const bookings = await Booking.find({ teacherId: teacher._id })
      .populate("studentId", "fullName email")
      .sort({ createdAt: -1 });

    const studyMaterials = await StudyMaterial.find({ uploadedBy: teacher._id })
      .sort({ createdAt: -1 });

    const stats = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
      pendingBookings: bookings.filter(b => b.status === "pending").length,
      totalEarnings: bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + (b.price || 0), 0),
      completedSessions: bookings.filter(b => b.status === "completed").length,
      averageRating: bookings.filter(b => b.rating).length > 0
        ? bookings.filter(b => b.rating).reduce((sum, b) => sum + b.rating, 0) / bookings.filter(b => b.rating).length
        : 0
    };

    const responseData = {
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        subjects: teacher.subjects,
        bio: teacher.bio,
        experience: teacher.experience,
        qualifications: teacher.qualifications,
        hourlyRate: teacher.hourlyRate,
        rating: stats.averageRating,
        totalSessions: stats.completedSessions
      },
      bookings,
      studyMaterials,
      stats
    };
    
    console.log("✅ Sending teacher dashboard data");
    res.json(responseData);
  } catch (error) {
    console.error("❌ Teacher dashboard error:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
});

// Update teacher profile
router.put("/profile", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can update their profile" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const teacher = await Teacher.findByIdAndUpdate(
      req.session.user.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(teacher);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Get teacher profile
router.get("/profile", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view their profile" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const teacher = await Teacher.findById(req.session.user.id).select("-password");
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(teacher);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Get teacher's bookings
router.get("/bookings", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view their bookings" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const bookings = await Booking.find({ teacherId: req.session.user.id })
      .populate("studentId", "fullName email grade")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error("Get teacher bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// Get teacher's study materials
router.get("/materials", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view their materials" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const materials = await StudyMaterial.find({ uploadedBy: req.session.user.id })
      .sort({ createdAt: -1 });

    res.json({ materials });
  } catch (error) {
    console.error("Get materials error:", error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

// Update teacher availability
router.put("/availability", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can update availability" });
    }

    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({ message: "Availability data is required" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const teacher = await Teacher.findByIdAndUpdate(
      req.session.user.id,
      { availability },
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ message: "Availability updated successfully", teacher });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({ message: "Failed to update availability" });
  }
});

// Get teacher statistics
router.get("/stats", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view their stats" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const bookings = await Booking.find({ teacherId: req.session.user.id });
    
    const stats = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
      pendingBookings: bookings.filter(b => b.status === "pending").length,
      completedBookings: bookings.filter(b => b.status === "completed").length,
      cancelledBookings: bookings.filter(b => b.status === "cancelled").length,
      totalEarnings: bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + (b.price || 0), 0),
      averageRating: bookings.filter(b => b.rating).length > 0
        ? bookings.filter(b => b.rating).reduce((sum, b) => sum + b.rating, 0) / bookings.filter(b => b.rating).length
        : 0,
      totalRatings: bookings.filter(b => b.rating).length
    };

    res.json({ stats });
  } catch (error) {
    console.error("Get teacher stats error:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// Get all teachers (for students to browse)
router.get("/all", async (req, res) => {
  try {
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const teachers = await Teacher.find({ isActive: true })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 });

    res.json({ teachers });
  } catch (error) {
    console.error("Get all teachers error:", error);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
});

export default router;
