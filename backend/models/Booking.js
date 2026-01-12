// models/Booking.js
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  subject: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "rejected", "completed", "cancelled"], 
    default: "pending" 
  },
  notes: { type: String },
  message: { type: String }, // Student's message to teacher
  price: { type: Number, default: 0 },
  meetingLink: { type: String }, // For live video sessions
  sessionNotes: { type: String }, // Teacher's notes after session
  rating: { type: Number, min: 1, max: 5 }, // Student rating after session
  feedback: { type: String }, // Student feedback after session
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  recordingUrl: { type: String }, // URL to session recording
  recordingDuration: { type: Number }, // Duration in seconds
  recordingTitle: { type: String, default: "Session Recording" } // Title for the recording
}, { timestamps: true });

// Index for efficient queries
BookingSchema.index({ studentId: 1, status: 1, startTime: -1 });
BookingSchema.index({ teacherId: 1, status: 1, startTime: -1 });
BookingSchema.index({ status: 1, startTime: 1 });

const Booking = mongoose.model("Booking", BookingSchema);
export default Booking;
