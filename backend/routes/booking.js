import express from "express";
import Booking from "../models/Booking.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Notification from "../models/Notification.js";
import StudyMaterial from "../models/StudyMaterial.js";

const router = express.Router();

// Helper: get current user ID and type
const getUserFromSession = (req) => {
  if (req.session.student?.id) return { id: req.session.student.id, type: "student" };
  if (req.session.teacher?.id) return { id: req.session.teacher.id, type: "teacher" };
  return null;
};

// Teachers list for students to browse (with availability status)
router.get("/teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find({}, "fullName email subjects bio experience").lean();
    
    // Check availability for each teacher
    const currentTime = new Date();
    const teachersWithAvailability = await Promise.all(
      teachers.map(async (teacher) => {
        // Check if teacher is currently busy
        const currentSession = await Booking.findOne({
          teacherId: teacher._id,
          status: { $in: ["confirmed", "pending"] },
          startTime: { $lte: currentTime },
          endTime: { $gte: currentTime }
        });

        // Also check for upcoming sessions in the next 30 minutes
        const upcomingSession = await Booking.findOne({
          teacherId: teacher._id,
          status: { $in: ["confirmed", "pending"] },
          startTime: { 
            $gte: currentTime,
            $lte: new Date(currentTime.getTime() + 30 * 60 * 1000) // Next 30 minutes
          }
        });

        let availability = "available";
        if (currentSession) {
          availability = "busy";
        } else if (upcomingSession) {
          availability = "busy"; // Show as busy if they have a session starting soon
        }

        return {
          ...teacher,
          _id: teacher._id,
          availability
        };
      })
    );

    res.json({ teachers: teachersWithAvailability });
  } catch (err) {
    console.error("Error fetching teachers:", err);
    res.status(500).json({ message: "Error fetching teachers", error: err.message });
  }
});

// Student bookings summary used by frontend
router.get("/student/bookings", async (req, res) => {
  try {
    const studentId = req.session.student?.id || req.session.user?.id;
    if (!studentId) return res.status(401).json({ message: "Not authenticated" });
    const bookings = await Booking.find({ studentId }).lean();
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
});

// Create booking request (student booking teacher)
router.post("/book", async (req, res) => {
  try {
    const studentId = req.session.student?.id || req.session.user?.id;
    if (!studentId) return res.status(401).json({ message: "Not authenticated" });
    
    const { teacherId, subject, message, scheduledDate } = req.body;
    if (!teacherId || !subject) return res.status(400).json({ message: "Missing required fields" });

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Check if teacher is available (not busy with another session)
    const currentTime = new Date();
    const existingBooking = await Booking.findOne({
      teacherId,
      status: { $in: ["confirmed", "pending"] },
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime }
    });

    if (existingBooking) {
      return res.status(400).json({ 
        message: "Teacher is currently busy with another session. Please try again later or book for a different time." 
      });
    }

    // Calculate session time (default 1 hour if not specified)
    const startTime = scheduledDate ? new Date(scheduledDate) : new Date();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    const booking = new Booking({
      studentId,
      teacherId,
      subject,
      startTime,
      endTime,
      message,
      status: "pending",
      price: 0 // Default free session
    });
    await booking.save();

    // Create notification for teacher
    const notification = new Notification({
      userId: teacherId,
      type: "booking",
      title: "New Booking Request",
      message: `You have a new booking request for ${subject} from a student.`,
      relatedId: booking._id,
      relatedModel: "Booking",
      priority: "high"
    });
    await notification.save();

    res.status(201).json({ 
      message: "Booking request sent successfully!",
      booking 
    });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ message: "Error creating booking", error: err.message });
  }
});

// Get materials by teacher
router.get("/teacher/:id/materials", async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ uploadedBy: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json({ materials });
  } catch (err) {
    res.status(500).json({ message: "Error fetching teacher materials", error: err.message });
  }
});

// Existing: Get all bookings for current user
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

// Teacher accept booking request
router.put("/:id/accept", async (req, res) => {
  try {
    const teacherId = req.session.teacher?.id || req.session.user?.id;
    if (!teacherId) return res.status(401).json({ message: "Not authenticated as teacher" });

    const { meetingLink } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check if teacher owns this booking
    if (!booking.teacherId.equals(teacherId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if booking is still pending
    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Booking is no longer pending" });
    }

    // Update booking status
    booking.status = "confirmed";
    if (meetingLink) booking.meetingLink = meetingLink;
    await booking.save();

    // Notify student
    const notification = new Notification({
      userId: booking.studentId,
      type: "booking",
      title: "Booking Accepted!",
      message: `Your booking request for ${booking.subject} has been accepted by the teacher.`,
      relatedId: booking._id,
      relatedModel: "Booking",
      priority: "high"
    });
    await notification.save();

    res.json({ 
      message: "Booking accepted successfully!",
      booking 
    });
  } catch (err) {
    console.error("Error accepting booking:", err);
    res.status(500).json({ message: "Error accepting booking", error: err.message });
  }
});

// Teacher reject booking request
router.put("/:id/reject", async (req, res) => {
  try {
    const teacherId = req.session.teacher?.id || req.session.user?.id;
    if (!teacherId) return res.status(401).json({ message: "Not authenticated as teacher" });

    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check if teacher owns this booking
    if (!booking.teacherId.equals(teacherId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if booking is still pending
    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Booking is no longer pending" });
    }

    // Update booking status
    booking.status = "rejected";
    if (reason) booking.notes = reason;
    await booking.save();

    // Notify student
    const notification = new Notification({
      userId: booking.studentId,
      type: "booking",
      title: "Booking Request Declined",
      message: `Your booking request for ${booking.subject} has been declined. ${reason ? `Reason: ${reason}` : "The teacher is not available at this time."}`,
      relatedId: booking._id,
      relatedModel: "Booking",
      priority: "medium"
    });
    await notification.save();

    res.json({ 
      message: "Booking request declined and student notified.",
      booking 
    });
  } catch (err) {
    console.error("Error rejecting booking:", err);
    res.status(500).json({ message: "Error rejecting booking", error: err.message });
  }
});

// Complete session (teacher marks session as completed)
router.put("/:id/complete", async (req, res) => {
  try {
    const teacherId = req.session.teacher?.id || req.session.user?.id;
    if (!teacherId) return res.status(401).json({ message: "Not authenticated as teacher" });

    const { sessionNotes } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check if teacher owns this booking
    if (!booking.teacherId.equals(teacherId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if booking is confirmed
    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Only confirmed bookings can be completed" });
    }

    // Update booking status
    booking.status = "completed";
    booking.isCompleted = true;
    booking.completedAt = new Date();
    if (sessionNotes) booking.sessionNotes = sessionNotes;
    await booking.save();

    // Notify student
    const notification = new Notification({
      userId: booking.studentId,
      type: "booking",
      title: "Session Completed",
      message: `Your session for ${booking.subject} has been completed. Please provide your feedback.`,
      relatedId: booking._id,
      relatedModel: "Booking",
      priority: "medium"
    });
    await notification.save();

    res.json({ 
      message: "Session completed successfully!",
      booking 
    });
  } catch (err) {
    console.error("Error completing session:", err);
    res.status(500).json({ message: "Error completing session", error: err.message });
  }
});

// 📝 Update booking status (student or teacher) - Legacy endpoint
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
      relatedId: booking._id,
      relatedModel: "Booking"
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

// Store session recording
router.post("/:id/recording", async (req, res) => {
  try {
    const user = getUserFromSession(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const { recordingUrl, duration, notes } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check if user is authorized (teacher or student of this booking)
    if (booking.teacherId.toString() !== user.id && booking.studentId.toString() !== user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update booking with recording details
    booking.recordingUrl = recordingUrl;
    booking.recordingDuration = duration;
    booking.sessionNotes = notes || booking.sessionNotes;
    booking.isCompleted = true;
    booking.completedAt = new Date();

    await booking.save();

    res.json({ message: "Session recording stored successfully", booking });
  } catch (error) {
    console.error("Error storing session recording:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get session recordings for a user
router.get("/recordings", async (req, res) => {
  try {
    const user = getUserFromSession(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    let query = {};
    if (user.type === "student") {
      query = { studentId: user.id, isCompleted: true, recordingUrl: { $exists: true } };
    } else if (user.type === "teacher") {
      query = { teacherId: user.id, isCompleted: true, recordingUrl: { $exists: true } };
    }

    const recordings = await Booking.find(query)
      .populate(user.type === "student" ? "teacherId" : "studentId", "fullName email")
      .sort({ completedAt: -1 })
      .lean();

    res.json({ recordings });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
