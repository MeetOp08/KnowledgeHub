import express from "express";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";

const router = express.Router();

// Helper to select model
const getModelByRole = (role) => {
  if (role === "teacher") return Teacher;
  if (role === "student") return Student;
  return null;
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { role, ...rest } = req.body;
    const normalizedRole = role.toLowerCase();
    const Model = getModelByRole(normalizedRole);
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    const existing = await Model.findOne({ email: rest.email });
    if (existing) return res.status(400).json({ message: `${normalizedRole} already exists` });

    const user = new Model(rest);
    await user.save();

    res.status(201).json({ message: "Registered successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedRole = role.toLowerCase();
    const Model = getModelByRole(normalizedRole);
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    const user = await Model.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Always save normalized role
    req.session.user = { id: user._id, email: user.email, role: normalizedRole };
    res.json({ message: "Login successful", user: req.session.user });
  } catch (err) {
    console.error(err);
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
        role: req.session.user.role.toLowerCase(), // ✅ always lowercase
      },
    });
  }
  res.status(401).json({ message: "Not authenticated" });
});

export default router;
