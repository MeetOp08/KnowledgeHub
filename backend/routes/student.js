import express from "express";
import Student from "../models/Student.js";
import Booking from "../models/Booking.js";
import StudyMaterial from "../models/StudyMaterial.js";


const router = express.Router();

// 📝 Get student dashboard data
router.get("/dashboard/data", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await Student.findById(userId);
    if (!user) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get student's bookings
    const bookings = await Booking.find({ studentId: user._id })
      .populate("teacherId", "fullName email subjects")
      .sort({ startTime: -1 });

    // Get study materials available to student (all materials for now)
    const studyMaterials = await StudyMaterial.find()
      .populate("uploadedBy", "fullName")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
    const pendingBookings = bookings.filter(b => b.status === "pending").length;
    const completedBookings = bookings.filter(b => b.status === "completed").length;

    res.json({
      student: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        grade: user.grade,
        school: user.school,
        subjects: user.subjects,
        learningGoals: user.learningGoals
      },
      bookings,
      studyMaterials,
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        completedBookings,
        totalMaterials: studyMaterials.length
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching dashboard data", error: err.message });
  }
});

export default router;
