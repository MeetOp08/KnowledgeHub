// backend/index.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";
import multer from "multer";
import crypto from "crypto";
import { existsSync } from "fs";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");

// Small utility to mask secrets in logs
const mask = (s) => {
  if (!s) return "NOT SET";
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
};

console.log("\n🔍 Starting KnowledgeHub backend (debug)");
console.log("   .env path:", envPath, existsSync(envPath) ? "(found)" : "(not found)");
console.log("   NODE_ENV :", process.env.NODE_ENV || "development");
console.log("   PORT     :", PORT);
console.log("   MONGO_URI:", process.env.MONGO_URI ? mask(process.env.MONGO_URI) : "NOT SET");
console.log("   OPENAI   :", mask(process.env.OPENAI_API_KEY));
console.log("   GROQ     :", mask(process.env.GROQ_API_KEY));
console.log("   AI_PROVIDER:", process.env.AI_PROVIDER || "NOT SET");
console.log("------------------------------------------------\n");

// MongoDB connection (use lowercase DB name to avoid case-mismatch issues)
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/knowledgehub";

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err?.message || err);
    process.exit(1);
  });

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Socket.io signaling server
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join-room", ({ roomId, userName }) => {
    if (!roomId) return;
    socket.data.roomId = roomId;
    socket.data.userName = userName;
    socket.join(roomId);

    const room = io.sockets.adapter.rooms.get(roomId) || new Set();
    const otherParticipants = [...room].filter((id) => id !== socket.id);
    socket.emit("existing-participants", { participants: otherParticipants });
    socket.to(roomId).emit("user-joined", { socketId: socket.id, userName });
  });

  socket.on("offer", ({ targetId, sdp }) => {
    if (targetId && sdp) {
      io.to(targetId).emit("offer", { from: socket.id, sdp });
    }
  });

  socket.on("answer", ({ targetId, sdp }) => {
    if (targetId && sdp) {
      io.to(targetId).emit("answer", { from: socket.id, sdp });
    }
  });

  socket.on("ice-candidate", ({ targetId, candidate }) => {
    if (targetId && candidate) {
      io.to(targetId).emit("ice-candidate", { from: socket.id, candidate });
    }
  });

  socket.on("chat-message", ({ roomId, sender, message }) => {
    if (roomId && message?.trim()) {
      io.to(roomId).emit("chat-message", {
        sender: sender || "Participant",
        message: message.trim(),
        timestamp: Date.now(),
      });
    }
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit("user-left", { socketId: socket.id });
      }
    });
  });
});

// Session configuration (auto-generate secret in dev if not set)
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(48).toString("hex");

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoURI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Uploads static folder
const uploadsDir = path.join(__dirname, "../uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) =>
    cb(
      null,
      `file-${Date.now()}-${Math.random().toString(36).slice(2)}.${file.originalname.split(".").pop()}`
    ),
});
const upload = multer({ storage });
app.use("/uploads", express.static(uploadsDir));

// Helper to conditionally import routes (won't throw if file missing)
const loadRouteIfExists = async (relativePath) => {
  try {
    const fullPath = path.join(__dirname, relativePath);
    if (!existsSync(fullPath)) {
      console.warn(`⚠️  Route file not found, skipping: ${relativePath}`);
      return null;
    }
    const modulePath = `file://${fullPath}`;
    const mod = await import(modulePath);
    return mod.default || null;
  } catch (err) {
    console.error(`❌ Failed to load route ${relativePath}:`, err);
    return null;
  }
};

// Top-level async IIFE to load routes and start server
(async () => {
  // conditional route loading
  const authRoutes = await loadRouteIfExists("./routes/auth.js");
  const chatRoutes = await loadRouteIfExists("./routes/chat.js");
  const studentRoutes = await loadRouteIfExists("./routes/student.js");
  const teacherRoutes = await loadRouteIfExists("./routes/teacher.js");
  const bookingRoutes = await loadRouteIfExists("./routes/booking.js");
  const notificationRoutes = await loadRouteIfExists("./routes/notifications.js");
  const studyMaterialRoutes = await loadRouteIfExists("./routes/studyMaterials.js");

  // mount routes only if loaded
  if (authRoutes) app.use("/api/auth", authRoutes);
  if (chatRoutes) app.use("/api/chat", chatRoutes);
  if (studentRoutes) app.use("/api/student", studentRoutes);
  if (teacherRoutes) app.use("/api/teacher", teacherRoutes);
  if (bookingRoutes) app.use("/api/booking", bookingRoutes);
  if (notificationRoutes) app.use("/api/notifications", notificationRoutes);
  if (studyMaterialRoutes) app.use("/api/study-materials", studyMaterialRoutes);

  // Health check
  app.get("/api/health", (req, res) =>
    res.json({ status: "OK", mongo: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected" })
  );

  // Generic API 404
  app.use("/api/*", (req, res) => {
    res.status(404).json({ success: false, message: "API endpoint not found" });
  });

  // Generic error handler
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  });

  // Start listening
  server.listen(PORT, () => {
    console.log(
      `\n🚀 KnowledgeHub backend running on http://localhost:${PORT} (env: ${process.env.NODE_ENV || "development"})`
    );
    console.log("==================================================");
  });
})();
