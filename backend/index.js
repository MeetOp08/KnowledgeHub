import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import passwordRoutes from "./routes/password.js"; // optional
import chatRoutes from "./routes/chat.js";
import teacherRoutes from "./routes/teacher.js";
import studentRoutes from "./routes/student.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 1234;

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

// MongoDB
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/knowledgehub";
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoURI, collectionName: "sessions" }),
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "lax",
      secure: false,
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", passwordRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);

// Test route
app.get("/api/message", (req, res) => res.json({ message: "Hello from backend!" }));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
