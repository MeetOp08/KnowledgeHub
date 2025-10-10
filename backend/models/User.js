import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher"], required: true },

  // Teacher-specific fields
  phone: String,
  gender: { type: String, enum: ["male", "female", "other"] },
  birthdate: Date,
  subjects: [String],
  bio: String,
  experience: String,
  qualifications: [String],
  hourlyRate: { type: Number, default: 0 },
  availability: {
    monday: [{ start: String, end: String }],
    tuesday: [{ start: String, end: String }],
    wednesday: [{ start: String, end: String }],
    thursday: [{ start: String, end: String }],
    friday: [{ start: String, end: String }],
    saturday: [{ start: String, end: String }],
    sunday: [{ start: String, end: String }]
  },
  rating: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare candidate password with stored hash
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ Fix overwrite model issue
export default mongoose.models.User || mongoose.model("User", userSchema);
