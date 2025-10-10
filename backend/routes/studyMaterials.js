import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import StudyMaterial from "../models/StudyMaterial.js";
import fs from "fs";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|gif|mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});

// 📝 Get all study materials
router.get("/", async (req, res) => {
  try {
    const { subject, grade, type, search } = req.query;
    let query = { isPublic: true };

    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    const materials = await StudyMaterial.find(query)
      .populate("uploadedBy", "fullName")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: "Error fetching study materials", error: err.message });
  }
});

// 📝 Get study material by ID
router.get("/:id", async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id)
      .populate("uploadedBy", "fullName")
      .populate("reviews.userId", "fullName");

    if (!material) {
      return res.status(404).json({ message: "Study material not found" });
    }

    // Increment download count
    material.downloadCount += 1;
    await material.save();

    res.json(material);
  } catch (err) {
    res.status(500).json({ message: "Error fetching study material", error: err.message });
  }
});

// 📝 Upload new study material
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.session.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, description, subject, grade, tags } = req.body;
    const fileType = path.extname(req.file.originalname).toLowerCase().substring(1);

    const studyMaterial = new StudyMaterial({
      title,
      description,
      subject,
      grade,
      type: fileType,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: req.session.user?.id,
      tags: tags ? tags.split(",").map(tag => tag.trim()) : []
    });

    await studyMaterial.save();
    res.status(201).json(studyMaterial);
  } catch (err) {
    res.status(500).json({ message: "Error uploading study material", error: err.message });
  }
});

// 📝 Update study material
router.put("/:id", async (req, res) => {
  try {
    if (!req.session.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Study material not found" });
    }

    // Check if user is the uploader
    if (material.uploadedBy.toString() !== req.session.user?.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { title, description, subject, grade, tags, isPublic } = req.body;
    
    material.title = title || material.title;
    material.description = description || material.description;
    material.subject = subject || material.subject;
    material.grade = grade || material.grade;
    material.tags = tags ? tags.split(",").map(tag => tag.trim()) : material.tags;
    material.isPublic = isPublic !== undefined ? isPublic : material.isPublic;

    await material.save();
    res.json(material);
  } catch (err) {
    res.status(500).json({ message: "Error updating study material", error: err.message });
  }
});

// 📝 Delete study material
router.delete("/:id", async (req, res) => {
  try {
    if (!req.session.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Study material not found" });
    }

    // Check if user is the uploader
    if (material.uploadedBy.toString() !== req.session.user?.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, "../../", material.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await StudyMaterial.findByIdAndDelete(req.params.id);
    res.json({ message: "Study material deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting study material", error: err.message });
  }
});

// 📝 Add review to study material
router.post("/:id/reviews", async (req, res) => {
  try {
    if (!req.session.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { rating, comment } = req.body;
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: "Study material not found" });
    }

    // Check if user already reviewed
    const existingReview = material.reviews.find(
      review => review.userId.toString() === req.session.user?.id
    );

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this material" });
    }

    material.reviews.push({
      userId: req.session.user?.id,
      rating,
      comment
    });

    // Update average rating
    const totalRating = material.reviews.reduce((sum, review) => sum + review.rating, 0);
    material.rating = totalRating / material.reviews.length;

    await material.save();
    res.json(material);
  } catch (err) {
    res.status(500).json({ message: "Error adding review", error: err.message });
  }
});

export default router;
