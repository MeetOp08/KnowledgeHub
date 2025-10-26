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

    // Get student's bookings (schema uses studentName and teacher ref)
    const bookings = await Booking.find({ studentName: user.fullName })
      .populate("teacher", "fullName email subjects")
      .sort({ createdAt: -1 });

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

// 📝 Update student profile
router.put("/profile", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { fullName, email, grade, school, subjects, learningGoals } = req.body;

    const student = await Student.findById(userId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update student fields
    student.fullName = fullName || student.fullName;
    student.email = email || student.email;
    student.grade = grade || student.grade;
    student.school = school || student.school;
    student.subjects = subjects || student.subjects;
    student.learningGoals = learningGoals || student.learningGoals;

    await student.save();

    res.json({
      id: student._id,
      fullName: student.fullName,
      email: student.email,
      grade: student.grade,
      school: student.school,
      subjects: student.subjects,
      learningGoals: student.learningGoals
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
});

export default router;
