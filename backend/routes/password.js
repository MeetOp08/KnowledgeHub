import express from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "data.json");

// Check if MongoDB is available
const isMongoDBAvailable = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

// File-based database helpers
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { teachers: [], students: [], sessions: {}, lastId: { teachers: 0, students: 0 } };
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
};

// --- EMAIL TRANSPORT SETUP ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address (sender)
    pass: process.env.EMAIL_PASS, // your Gmail app password
  },
});

// Helper to find user in both MongoDB and file-based storage
const findUser = async (email) => {
  if (isMongoDBAvailable()) {
    // Try MongoDB first
    let user = await Teacher.findOne({ email });
    if (user) return { user, collection: 'teachers' };
    
    user = await Student.findOne({ email });
    if (user) return { user, collection: 'students' };
    
    return null;
  } else {
    // Use file-based storage
    const data = readData();
    
    let user = data.teachers.find(u => u.email === email);
    if (user) return { user, collection: 'teachers' };
    
    user = data.students.find(u => u.email === email);
    if (user) return { user, collection: 'students' };
    
    return null;
  }
};

// --- REQUEST PASSWORD RESET ---
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const result = await findUser(email);
    if (!result) {
      return res.status(404).json({ message: "User not found with this email." });
    }

    const { user, collection } = result;

    // Create a reset token
    const token = crypto.randomBytes(32).toString("hex");
    const resetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (isMongoDBAvailable()) {
      // Update MongoDB user
      user.resetPasswordToken = token;
      user.resetPasswordExpire = resetExpire;
      await user.save();
    } else {
      // Update file-based user
      const data = readData();
      const userIndex = data[collection].findIndex(u => u.email === email);
      if (userIndex !== -1) {
        data[collection][userIndex].resetPasswordToken = token;
        data[collection][userIndex].resetPasswordExpire = resetExpire;
        writeData(data);
      }
    }

    const resetURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;

    // Send reset link to the entered email
    const mailOptions = {
      from: `"KnowledgeHub Support" <${process.env.EMAIL_USER || 'noreply@knowledgehub.com'}>`,
      to: email,
      subject: "Reset Your Password - KnowledgeHub",
      html: `
        <p>Hello ${user.name || user.fullName || "User"},</p>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetURL}" target="_blank" style="color: #007bff;">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <br/>
        <p>Regards,<br/>KnowledgeHub Team</p>
      `,
    };

    // Only send email if email is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      res.json({ message: "Password reset email sent successfully!" });
    } else {
      res.json({ 
        message: "Password reset token generated! (Email not configured)", 
        token: token,
        resetURL: resetURL 
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Error processing password reset request" });
  }
});

// --- RESET PASSWORD ROUTE ---
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (isMongoDBAvailable()) {
      // MongoDB implementation
      let user = await Teacher.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        user = await Student.findOne({
          resetPasswordToken: token,
          resetPasswordExpire: { $gt: Date.now() },
        });
      }

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.json({ message: "Password has been reset successfully!" });
    } else {
      // File-based implementation
      const data = readData();
      let userFound = null;
      let collection = null;
      let userIndex = -1;

      // Check teachers
      userIndex = data.teachers.findIndex(u => 
        u.resetPasswordToken === token && 
        u.resetPasswordExpire > Date.now()
      );
      if (userIndex !== -1) {
        userFound = data.teachers[userIndex];
        collection = 'teachers';
      }

      // Check students if not found in teachers
      if (!userFound) {
        userIndex = data.students.findIndex(u => 
          u.resetPasswordToken === token && 
          u.resetPasswordExpire > Date.now()
        );
        if (userIndex !== -1) {
          userFound = data.students[userIndex];
          collection = 'students';
        }
      }

      if (!userFound) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      data[collection][userIndex].password = hashed;
      data[collection][userIndex].resetPasswordToken = undefined;
      data[collection][userIndex].resetPasswordExpire = undefined;

      if (writeData(data)) {
        res.json({ message: "Password has been reset successfully!" });
      } else {
        res.status(500).json({ message: "Error saving password reset" });
      }
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
});

export default router;