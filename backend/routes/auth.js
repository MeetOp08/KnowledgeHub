import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

const router = express.Router();

// Check if MongoDB is available
const isMongoDBAvailable = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

// Registration endpoint
router.post("/register", async (req, res) => {
  try {
    const { role, name, email, password } = req.body;
    
    console.log("Registration request:", { role, name, email });
    
    if (!role || !name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: "Database not available. Please try again later." 
      });
    }

    // Check if user already exists
    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });
    
    if (existingStudent || existingTeacher) {
      return res.status(400).json({ 
        success: false, 
        message: "User already exists with this email" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user based on role
    let user;
    if (role === "student") {
      user = new Student({
        fullName: name,
        email,
        password: hashedPassword,
        role: "student"
      });
    } else if (role === "teacher") {
      user = new Teacher({
        fullName: name,
        email,
        password: hashedPassword,
        role: "teacher"
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid role. Must be 'student' or 'teacher'" 
      });
    }

    await user.save();

    console.log("User registered successfully:", user.email);

    // Store user in session
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.fullName
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Registration failed",
      error: error.message 
    });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    console.log("Login request:", { email, role });
    
    if (!email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, password, and role are required" 
      });
    }

    if (role !== "student" && role !== "teacher") {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid role. Must be 'student' or 'teacher'" 
      });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: "Database not available. Please try again later." 
      });
    }

    // Find user based on role
    let user = null;
    if (role === "student") {
      user = await Student.findOne({ email });
    } else if (role === "teacher") {
      user = await Teacher.findOne({ email });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Verify the user's role matches what they selected
    if (user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        message: `You are registered as a ${user.role}. Please login as ${user.role}.` 
      });
    }

    console.log("User logged in successfully:", user.email, "as", user.role);

    // Store user in session
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.fullName
    };

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Login failed",
      error: error.message 
    });
  }
});

// Get current user endpoint
router.get("/me", (req, res) => {
  if (req.session.user) {
    return res.json({
      user: {
        id: req.session.user.id,
        email: req.session.user.email,
        role: req.session.user.role,
        name: req.session.user.name
      },
    });
  }
  res.status(401).json({ message: "Not authenticated" });
});

// Logout endpoint
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// Forgot password endpoint
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: "Database not available. Please try again later." 
      });
    }

    // Find user in both collections
    let user = await Student.findOne({ email });
    if (!user) {
      user = await Teacher.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "No user found with this email" 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send email with reset link
    // For now, just return success
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: "Password reset email sent",
      resetToken: resetToken // Remove this in production
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process request",
      error: error.message 
    });
  }
});

// Reset password endpoint
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: "Password is required" 
      });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: "Database not available. Please try again later." 
      });
    }

    // Find user with valid reset token
    let user = await Student.findOne({ 
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      user = await Teacher.findOne({ 
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
    }

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to reset password",
      error: error.message 
    });
  }
});

// Get all users (for testing)
router.get("/users", async (req, res) => {
  try {
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: "Database not available" 
      });
    }

    const students = await Student.find({}, { password: 0 });
    const teachers = await Teacher.find({}, { password: 0 });
    
    res.json({
      students: students.map(user => ({
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      })),
      teachers: teachers.map(user => ({
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get users",
      error: error.message 
    });
  }
});

export default router;
