// models/StudyMaterial.js
import mongoose from "mongoose";

const StudyMaterialSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  title: { type: String, required: true },
  link: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const StudyMaterial = mongoose.model("StudyMaterial", StudyMaterialSchema);
export default StudyMaterial;
