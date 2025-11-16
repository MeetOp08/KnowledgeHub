import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import MongoStore from "connect-mongo";
import { fileURLToPath } from "url";
import session from "express-session";
import multer from "multer";
import crypto from "crypto";

// Import route modules
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import teacherRoutes from "./routes/teacher.js";
import bookingRoutes from "./routes/booking.js";
import chatRoutes from "./routes/chat.js";
import notificationRoutes from "./routes/notifications.js";
import studyMaterialRoutes from "./routes/studyMaterials.js";

// Load env
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mongo URI
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/KnowledgeHub";

// 🧠 Connect MongoDB
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));

// ✅ CORS (must come before session)
app.use(
  cors({
    origin: "http://localhost:5173", // your frontend
    credentials: true, // allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ JSON Parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Auto-generate session secret if not provided
const generateSessionSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// ✅ Sessions (must come after CORS)
app.use(
  session({
    secret: process.env.SESSION_SECRET || generateSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoURI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: false, // only true on HTTPS (production)
      sameSite: "lax", // important for localhost cross-origin
      maxAge: 1000 * 60 * 60 * 24, // 24h
    },
  })
);

// ✅ Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) =>
    cb(null, `file-${Date.now()}-${Math.random().toString(36).slice(2)}.${file.originalname.split(".").pop()}`),
});
const upload = multer({ storage });
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/study-materials", studyMaterialRoutes);

// ✅ Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    mongo: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 KnowledgeHub Backend running at http://localhost:${PORT}`);
  console.log("==================================================");
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
