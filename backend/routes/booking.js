import express from "express";
import Booking from "../models/Booking.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// Helper: get current user ID and type
const getUserFromSession = (req) => {
  if (req.session.student?.id) return { id: req.session.student.id, type: "student" };
  if (req.session.teacher?.id) return { id: req.session.teacher.id, type: "teacher" };
  return null;
};

// 📝 Get all bookings for current user
router.get("/", async (req, res) => {
  try {
    const user = getUserFromSession(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    let bookings;
    if (user.type === "student") {
      bookings = await Booking.find({ studentId: user.id })
        .populate("teacherId", "fullName email subjects")
        .sort({ startTime: -1 });
    } else {
      bookings = await Booking.find({ teacherId: user.id })
        .populate("studentId", "fullName email")
        .sort({ startTime: -1 });
    }

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
});

// 📝 Create a new booking (student only)
router.post("/", async (req, res) => {
  try {
    const user = getUserFromSession(req);
    if (!user || user.type !== "student") return res.status(401).json({ message: "Not authenticated as student" });

    const { teacherId, subject, startTime, endTime, notes, price } = req.body;
    if (!teacherId || !subject || !startTime || !endTime || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Check for conflicting bookings
    const conflict = await Booking.findOne({
      teacherId,
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) },
      status: { $in: ["pending", "confirmed"] }
    });

    if (conflict) return res.status(400).json({ message: "Time slot already booked" });

    const booking = new Booking({
      studentId: user.id,
      teacherId,
      subject,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes,
      price,
      status: "pending"
    });
    await booking.save();

    // Create notification for teacher
    const notification = new Notification({
      userId: teacherId,
      type: "booking",
      title: "New Booking Request",
      message: `You have a new booking request for ${subject}`,
      relatedId: booking._id,
      priority: "high"
    });
    await notification.save();

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: "Error creating booking", error: err.message });
  }
});

// 📝 Update booking status (student or teacher)
router.put("/:id/status", async (req, res) => {
  try {
    const user = getUserFromSession(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const { status, meetingLink } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Permission check
    const userId = user.id;
    if (!booking.teacherId.equals(userId) && !booking.studentId.equals(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = status;
    if (meetingLink) booking.meetingLink = meetingLink;
    await booking.save();

    // Notify the other party
    const otherUserId = booking.teacherId.equals(userId) ? booking.studentId : booking.teacherId;
    const notification = new Notification({
      userId: otherUserId,
      type: "booking",
      title: "Booking Status Updated",
      message: `Your booking has been ${status}`,
      relatedId: booking._id
    });
    await notification.save();

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Error updating booking", error: err.message });
  }
});

// 📝 Delete a booking (student or teacher)
router.delete("/:id", async (req, res) => {
  try {
    const user = getUserFromSession(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const userId = user.id;
    if (!booking.teacherId.equals(userId) && !booking.studentId.equals(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting booking", error: err.message });
  }
});

export default router;
