import express from "express";
import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "data.json");

// Check if MongoDB is available (dynamic check)
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

// Helper to select model or collection
const getUserCollection = (role) => {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole === "teacher") return "teachers";
  if (normalizedRole === "student") return "students";
  return null;
};

// File-based password hashing
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { role, name, email, password } = req.body;
    const normalizedRole = role.toLowerCase();
    
    if (!["teacher", "student"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if MongoDB is available
    if (isMongoDBAvailable()) {
      // Use MongoDB
      const Model = normalizedRole === "teacher" ? Teacher : Student;
      const existing = await Model.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: `${normalizedRole} already exists` });
      }

      const user = new Model({ fullName: name, email, password });
      await user.save();

      res.status(201).json({ 
        message: "Registered successfully", 
        user: { id: user._id, email: user.email, role: normalizedRole, name: user.fullName }
      });
    } else {
      // Use file-based storage
      const data = readData();
      const collection = getUserCollection(normalizedRole);
      
      // Check if user already exists
      const existing = data[collection].find(user => user.email === email);
      if (existing) {
        return res.status(400).json({ message: `${normalizedRole} already exists` });
      }

      // Create new user
      const hashedPassword = await hashPassword(password);
      const newUser = {
        id: (++data.lastId[collection]).toString(),
        name: name || `${normalizedRole} user`,
        email,
        password: hashedPassword,
        role: normalizedRole,
        createdAt: new Date().toISOString()
      };

      data[collection].push(newUser);
      
      if (writeData(data)) {
        res.status(201).json({ 
          message: "Registered successfully", 
          user: { id: newUser.id, email: newUser.email, role: normalizedRole, name: newUser.name }
        });
      } else {
        res.status(500).json({ message: "Error saving user data" });
      }
    }
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedRole = role.toLowerCase();
    
    if (!["teacher", "student"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if MongoDB is available
    if (isMongoDBAvailable()) {
      // Use MongoDB
      const Model = normalizedRole === "teacher" ? Teacher : Student;
      const user = await Model.findOne({ email });
      
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      req.session.user = { id: user._id, email: user.email, role: normalizedRole };
      res.json({ 
        message: "Login successful", 
        user: { id: user._id, email: user.email, role: normalizedRole, name: user.fullName }
      });
    } else {
      // Use file-based storage
      const data = readData();
      const collection = getUserCollection(normalizedRole);
      
      const user = data[collection].find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      req.session.user = { id: user.id, email: user.email, role: normalizedRole };
      res.json({ 
        message: "Login successful", 
        user: { id: user.id, email: user.email, role: normalizedRole, name: user.name }
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error logging in" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user
router.get("/me", (req, res) => {
  if (req.session.user) {
    return res.json({
      user: {
        id: req.session.user.id,
        email: req.session.user.email,
        role: req.session.user.role.toLowerCase(),
      },
    });
  }
  res.status(401).json({ message: "Not authenticated" });
});

// Get all users (for testing)
router.get("/users", (req, res) => {
  if (isMongoDBAvailable()) {
    res.json({ message: "MongoDB mode - use individual model endpoints" });
  } else {
    const data = readData();
    res.json({
      teachers: data.teachers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
      students: data.students.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
  }
});

export default router;