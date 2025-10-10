import express from "express";
import crypto from "crypto";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";

const router = express.Router();

// Helper to select model
const getModelByRole = (role) => {
  if (role === "teacher") return Teacher;
  if (role === "student") return Student;
  return null;
};

// Forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, role } = req.body;
    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    console.log(`Reset Link: http://localhost:3000/reset-password/${resetToken}`);

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending reset link" });
  }
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    let user = await Teacher.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      user = await Student.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    }

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error resetting password" });
  }
});

export default router;
