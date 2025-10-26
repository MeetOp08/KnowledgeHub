import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple session store (in-memory for testing)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "lax",
      secure: false,
    },
  })
);

// Mock user data (in-memory for testing)
const mockUsers = {
  teachers: [
    { id: "1", email: "teacher@test.com", password: "password123", role: "teacher", name: "Test Teacher" },
    { id: "2", email: "teacher2@test.com", password: "password123", role: "teacher", name: "Test Teacher 2" }
  ],
  students: [
    { id: "1", email: "student@test.com", password: "password123", role: "student", name: "Test Student" },
    { id: "2", email: "student2@test.com", password: "password123", role: "student", name: "Test Student 2" }
  ]
};

// Simple password comparison (for testing only)
const comparePassword = (userPassword, inputPassword) => {
  return userPassword === inputPassword;
};

// Register endpoint
app.post("/api/auth/register", async (req, res) => {
  try {
    const { role, email, password, name } = req.body;
    const normalizedRole = role.toLowerCase();
    
    if (!["teacher", "student"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user already exists
    const existingUser = mockUsers[normalizedRole + "s"].find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: `${normalizedRole} already exists` });
    }

    // Create new user
    const newUser = {
      id: (mockUsers[normalizedRole + "s"].length + 1).toString(),
      email,
      password,
      role: normalizedRole,
      name: name || `${normalizedRole} user`
    };

    mockUsers[normalizedRole + "s"].push(newUser);

    res.status(201).json({ 
      message: "Registered successfully", 
      user: { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedRole = role.toLowerCase();
    
    if (!["teacher", "student"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = mockUsers[normalizedRole + "s"].find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!comparePassword(user.password, password)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Set session
    req.session.user = { id: user.id, email: user.email, role: normalizedRole };
    res.json({ 
      message: "Login successful", 
      user: { id: user.id, email: user.email, role: normalizedRole, name: user.name }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging in" });
  }
});

// Logout endpoint
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user endpoint
app.get("/api/auth/me", (req, res) => {
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

// Test route
app.get("/api/message", (req, res) => res.json({ message: "Hello from backend!" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend is running", users: mockUsers });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📝 Auth API available at http://localhost:${PORT}/api/auth`);
  console.log(`👥 Mock users created:`);
  console.log(`   Teachers: ${mockUsers.teachers.map(u => u.email).join(', ')}`);
  console.log(`   Students: ${mockUsers.students.map(u => u.email).join(', ')}`);
  console.log(`🔑 All passwords are: password123`);
});
