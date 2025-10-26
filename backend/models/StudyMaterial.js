// models/StudyMaterial.js
import mongoose from "mongoose";

const StudyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  subject: { type: String, required: true },
  grade: { type: String, default: "" },
  type: { type: String, enum: ["pdf", "video", "notes", "quiz", "image"], required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, default: "" },
  fileSize: { type: Number, default: 0 },
  duration: { type: String, default: "" },
  thumbnail: { type: String, default: "" },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  tags: [{ type: String }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  isPublic: { type: Boolean, default: true },
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, default: "" }
    }
  ]
}, { timestamps: true });

const StudyMaterial = mongoose.model("StudyMaterial", StudyMaterialSchema);
export default StudyMaterial;
