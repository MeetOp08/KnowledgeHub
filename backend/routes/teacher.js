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
    // Read teacher identity from unified auth session, fallback to legacy session key
    const teacherId =
      (req.session.user?.role === "teacher" && req.session.user.id) ||
      req.session.teacherId ||
      null;
    if (!teacherId) return res.status(401).json({ message: "Unauthorized" });

    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const bookings = await Booking.find({ teacherId: teacherId })
      .populate("studentId", "fullName email")
      .lean();
    const studyMaterials = await StudyMaterial.find({ uploadedBy: teacherId }).lean();

    const stats = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
      pendingBookings: bookings.filter(b => b.status === "pending").length,
      totalEarnings: bookings.reduce((sum, b) => sum + (typeof b.amount === "number" ? b.amount : 0), 0)
    };

    res.json({ teacher, bookings, studyMaterials, stats });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==================== Profile Management ====================
router.put("/profile", async (req, res) => {
  try {
    // Check authentication - support both new and legacy session structure
    const teacherId = (req.session.user?.role === "teacher" && req.session.user.id) || req.session.teacherId;
    if (!teacherId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { fullName, email, bio, experience, subjects, qualifications, hourlyRate } = req.body;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Update teacher fields
    teacher.fullName = fullName || teacher.fullName;
    teacher.email = email || teacher.email;
    teacher.bio = bio || teacher.bio;
    teacher.experience = experience || teacher.experience;
    teacher.subjects = subjects || teacher.subjects;
    teacher.qualifications = qualifications || teacher.qualifications;
    teacher.hourlyRate = hourlyRate !== undefined ? hourlyRate : teacher.hourlyRate;

    await teacher.save();

    res.json({
      id: teacher._id,
      fullName: teacher.fullName,
      email: teacher.email,
      bio: teacher.bio,
      experience: teacher.experience,
      subjects: teacher.subjects,
      qualifications: teacher.qualifications,
      hourlyRate: teacher.hourlyRate,
      rating: teacher.rating,
      totalSessions: teacher.totalSessions
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
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
