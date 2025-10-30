import express from "express";
import mongoose from "mongoose";
import Student from "../models/Student.js";
import Booking from "../models/Booking.js";
import StudyMaterial from "../models/StudyMaterial.js";

const router = express.Router();

// ✅ MongoDB availability check
const isMongoDBAvailable = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

/* ========================================================
   📊 STUDENT DASHBOARD
======================================================== */
router.get("/dashboard/data", async (req, res) => {
  try {
    console.log("📊 Student dashboard request");

    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.session.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const student = await Student.findById(req.session.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

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

    res.json({
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
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
});

/* ========================================================
   🧾 UPDATE PROFILE
======================================================== */
// backend/routes/student.js
router.put('/profile/update', async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const studentId = req.session.user.id;
    const update = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(studentId, update, { new: true });
    if (!updatedStudent) return res.status(404).json({ error: 'Student not found' });
    res.json({ student: updatedStudent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
/* ========================================================
   👤 GET PROFILE
======================================================== */
router.get("/profile", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view their profile" });
    }
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const student = await Student.findById(req.session.user.id).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

/* ========================================================
   📅 BOOKINGS
======================================================== */
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
    console.error("❌ Get bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

/* ========================================================
   📚 STUDY MATERIALS
======================================================== */
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
    console.error("❌ Get materials error:", error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

/* ========================================================
   ⭐ RATE COMPLETED SESSION
======================================================== */
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
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.studentId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only rate your own bookings" });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Can only rate completed sessions" });
    }

    booking.rating = rating;
    if (feedback) booking.feedback = feedback;
    await booking.save();

    res.json({ message: "Rating submitted successfully", booking });
  } catch (error) {
    console.error("❌ Rate session error:", error);
    res.status(500).json({ message: "Failed to submit rating" });
  }
});

/* ========================================================
   ❌ CANCEL BOOKING
======================================================== */
router.put("/bookings/:bookingId/cancel", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "student") {
      return res.status(403).json({ message: "Only students can cancel bookings" });
    }
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const { reason } = req.body;
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.studentId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only cancel your own bookings" });
    }
    if (booking.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel completed sessions" });
    }

    booking.status = "cancelled";
    if (reason) booking.notes = reason;
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    console.error("❌ Cancel booking error:", error);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

export default router;
