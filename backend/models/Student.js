import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, default: "student", required: true },
  phone:    { type: String },
  gender:   { type: String, enum: ["male", "female", "other"] },
  birthdate:{ type: Date },
  grade:    { type: String },
  school:   { type: String },
  subjects: [{ type: String }],
  learningGoals: [{ type: String }],
  preferredLearningStyle: { type: String },
  timezone: { type: String, default: "UTC" },
  avatarUrl: { type: String },
  address: { type: String },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Hash password before saving
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password   = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Compare password
studentSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ Auto-update timestamp
studentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Student", studentSchema);
