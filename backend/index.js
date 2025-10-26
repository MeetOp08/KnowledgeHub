import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:1239",
      "http://127.0.0.1:1239",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/knowledgehub";
let useMongoDB = false;

// Try to connect to MongoDB
mongoose
  .connect(mongoURI, { 
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    useMongoDB = true;
  })
  .catch((err) => {
    console.log("⚠️  MongoDB not available, using file-based storage");
    console.log("   To use MongoDB, install it or use MongoDB Atlas");
    useMongoDB = false;
  });

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: "lax",
    secure: false,
  },
};

// Use MongoDB store if available, otherwise use memory store
if (useMongoDB) {
  sessionConfig.store = MongoStore.create({ 
    mongoUrl: mongoURI, 
    collectionName: "sessions" 
  });
}

app.use(session(sessionConfig));

// File-based database fallback
const DATA_FILE = path.join(__dirname, "data.json");

// Initialize file-based data if MongoDB is not available
if (!useMongoDB) {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      teachers: [],
      students: [],
      sessions: {},
      lastId: { teachers: 0, students: 0 }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log("📁 Created file-based database");
  }
}

// Import and setup routes
async function setupRoutes() {
  try {
    console.log("📦 Importing routes...");
    
    const authRoutes = await import("./routes/auth.js");
    const passwordRoutes = await import("./routes/password.js");
    const chatRoutes = await import("./routes/chat.js");
    const teacherRoutes = await import("./routes/teacher.js");
    const studentRoutes = await import("./routes/student.js");
    const studyMaterialsRoutes = await import("./routes/studyMaterials.js");
    const bookingRoutes = await import("./routes/booking.js");
    const aiRoutes = await import("./routes/ai.js");
    const notificationRoutes = await import("./routes/notifications.js");
    
    console.log("✅ All routes imported successfully");
    
    // Setup routes
    app.use("/api/auth", authRoutes.default);
    app.use("/api/auth", passwordRoutes.default);
    app.use("/api/ai", aiRoutes.default);
    app.use("/api/chat", chatRoutes.default);
    app.use("/api/teacher", teacherRoutes.default);
    app.use("/api/student", studentRoutes.default);
    app.use("/api/booking", bookingRoutes.default);
    app.use("/api/study-materials", studyMaterialsRoutes.default);
    app.use("/api/notifications", notificationRoutes.default);
    
    console.log("✅ Routes setup complete");
    
  } catch (error) {
    console.error("❌ Error importing routes:", error);
    process.exit(1);
  }
}

// Static file serving for uploaded study materials
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Test route
app.get("/api/message", (req, res) => {
  res.json({ 
    message: "Hello from KnowledgeHub backend!", 
    database: useMongoDB ? "MongoDB" : "File-based",
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    database: useMongoDB ? "MongoDB" : "File-based",
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
async function startServer() {
  try {
    // Setup routes first
    await setupRoutes();
    
    // Start listening
    app.listen(PORT, () => {
      console.log("\n🚀 KnowledgeHub Backend Server Started!");
      console.log(`📍 Server running at http://localhost:${PORT}`);
      console.log(`📊 Database: ${useMongoDB ? "MongoDB" : "File-based"}`);
      console.log(`🌐 CORS enabled for frontend ports: 5173, 1239`);
      console.log(`📁 Uploads directory: ${path.join(__dirname, "../uploads")}`);
      console.log("=" .repeat(50));
    });
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();