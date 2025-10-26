import mongoose from "mongoose";
import Student from "./models/Student.js";
import Teacher from "./models/Teacher.js";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/knowledgehub";

async function checkMongoData() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Check students
    const students = await Student.find({});
    console.log(`\n📚 Students in MongoDB (${students.length}):`);
    students.forEach(student => {
      console.log(`  - ${student.email} (${student.fullName})`);
    });

    // Check teachers  
    const teachers = await Teacher.find({});
    console.log(`\n👨‍🏫 Teachers in MongoDB (${teachers.length}):`);
    teachers.forEach(teacher => {
      console.log(`  - ${teacher.email} (${teacher.fullName})`);
    });

    // Check if Meet Patel exists in MongoDB
    const meetStudent = await Student.findOne({ email: "Meet@test.com" });
    if (meetStudent) {
      console.log(`\n✅ Found Meet Patel in MongoDB: ${meetStudent.fullName}`);
    } else {
      console.log(`\n❌ Meet Patel NOT found in MongoDB`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

checkMongoData();
