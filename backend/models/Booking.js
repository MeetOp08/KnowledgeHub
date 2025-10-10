// models/Booking.js
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  studentName: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  amount: { type: Number, default: 0 }
}, { timestamps: true });

const Booking = mongoose.model("Booking", BookingSchema);
export default Booking;
