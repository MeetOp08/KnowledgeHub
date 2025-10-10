import express from "express";
import Teacher from "../models/Teacher.js";
import Booking from "../models/Booking.js";
import StudyMaterial from "../models/StudyMaterial.js";

const router = express.Router();

// ==================== Login ====================
router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    req.session.teacherId = teacher._id;
    res.json({ message: "Logged in successfully", teacherId: teacher._id });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==================== Dashboard ====================
router.get("/dashboard/data", async (req, res) => {
  try {
    const teacherId = req.session.teacherId;
    if (!teacherId) return res.status(401).json({ message: "Unauthorized" });

    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const bookings = await Booking.find({ teacher: teacherId }).lean();
    const studyMaterials = await StudyMaterial.find({ teacher: teacherId }).lean();

    const stats = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
      pendingBookings: bookings.filter(b => b.status === "pending").length,
      totalEarnings: bookings.reduce((sum, b) => sum + b.amount, 0)
    };

    res.json({ teacher, bookings, studyMaterials, stats });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==================== Logout ====================
router.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Logout failed", error: err.message });
    res.json({ message: "Logged out successfully" });
  });
});

export default router;
