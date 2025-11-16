import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import StudyMaterial from "../models/StudyMaterial.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads/"));
  },
  filename: function (req, file, cb) {
    cb(null, `file-${Date.now()}-${Math.floor(Math.random() * 1e9)}.${file.originalname.split('.').pop()}`);
  }
});

const upload = multer({ storage: storage });

// Check if MongoDB is available
const isMongoDBAvailable = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

// Get all study materials
router.get("/", async (req, res) => {
  try {
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const { subject, grade, type, search } = req.query;
    let query = { isPublic: true };

    // Apply filters
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    if (grade) {
      query.grade = { $regex: grade, $options: 'i' };
    }
    if (type) {
      query.type = type;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const materials = await StudyMaterial.find(query)
      .populate("uploadedBy", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ materials });
  } catch (error) {
    console.error("Get materials error:", error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

// Upload study material
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can upload materials" });
    }

    const { title, description, subject, grade, tags, isPublic } = req.body;

    if (!title || !subject || !req.file) {
      return res.status(400).json({ message: "Title, subject, and file are required" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const material = new StudyMaterial({
      title,
      description: description || "",
      subject,
      grade: grade || "",
      type: req.file.mimetype.startsWith("video/") ? "video" : 
            req.file.mimetype === "application/pdf" ? "pdf" : "notes",
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      uploadedBy: req.session.user.id,
      isPublic: isPublic === "true" || isPublic === true
    });

    await material.save();
    res.status(201).json({ message: "Material uploaded successfully", material });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
});

// Get specific study material
router.get("/:id", async (req, res) => {
  try {
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const material = await StudyMaterial.findById(req.params.id)
      .populate("uploadedBy", "fullName email");

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    res.json({ material });
  } catch (error) {
    console.error("Get material error:", error);
    res.status(500).json({ message: "Failed to fetch material" });
  }
});

// Update study material
router.put("/:id", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can update materials" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    if (material.uploadedBy.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only update your own materials" });
    }

    const updatedMaterial = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ message: "Material updated successfully", material: updatedMaterial });
  } catch (error) {
    console.error("Update material error:", error);
    res.status(500).json({ message: "Failed to update material" });
  }
});

// Delete study material
router.delete("/:id", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can delete materials" });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    if (material.uploadedBy.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only delete your own materials" });
    }

    await StudyMaterial.findByIdAndDelete(req.params.id);
    res.json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

// Track material view
router.post("/:id/view", async (req, res) => {
  try {
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Increment view count
    material.views = (material.views || 0) + 1;
    await material.save();

    res.json({ message: "View tracked successfully" });
  } catch (error) {
    console.error("Track view error:", error);
    res.status(500).json({ message: "Failed to track view" });
  }
});

// Download material
router.get("/:id/download", async (req, res) => {
  try {
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Increment download count
    material.downloads = (material.downloads || 0) + 1;
    await material.save();

    // Return file URL for download
    res.json({ 
      message: "Download initiated",
      fileUrl: material.fileUrl,
      fileName: material.fileName
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Failed to initiate download" });
  }
});

// Get materials by teacher
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const materials = await StudyMaterial.find({ 
      uploadedBy: req.params.teacherId,
      isPublic: true 
    })
    .populate("uploadedBy", "fullName email")
    .sort({ createdAt: -1 });

    res.json({ materials });
  } catch (error) {
    console.error("Get teacher materials error:", error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

// Get materials by subject
router.get("/subject/:subject", async (req, res) => {
  try {
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const materials = await StudyMaterial.find({ 
      subject: { $regex: req.params.subject, $options: 'i' },
      isPublic: true 
    })
    .populate("uploadedBy", "fullName email")
    .sort({ createdAt: -1 });

    res.json({ materials });
  } catch (error) {
    console.error("Get materials by subject error:", error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

// Get popular materials
router.get("/popular", async (req, res) => {
  try {
    if (!isMongoDBAvailable()) {
      return res.status(503).json({ message: "Database not available" });
    }

    const materials = await StudyMaterial.find({ isPublic: true })
      .populate("uploadedBy", "fullName email")
      .sort({ views: -1, downloads: -1 })
      .limit(10);

    res.json({ materials });
  } catch (error) {
    console.error("Get popular materials error:", error);
    res.status(500).json({ message: "Failed to fetch popular materials" });
  }
});

export default router;
