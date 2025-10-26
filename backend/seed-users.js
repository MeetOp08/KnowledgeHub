import mongoose from "mongoose";
import Teacher from "./models/Teacher.js";
import Student from "./models/Student.js";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/knowledgehub";

async function seedTestUsers() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Create test students
    const testStudents = [
      {
        fullName: "Test Student",
        email: "student@test.com",
        password: "password123"
      },
      {
        fullName: "Test Student 2", 
        email: "student2@test.com",
        password: "password123"
      }
    ];

    // Create test teachers
    const testTeachers = [
      {
        fullName: "Test Teacher",
        email: "teacher@test.com", 
        password: "password123"
      },
      {
        fullName: "Test Teacher 2",
        email: "teacher2@test.com",
        password: "password123"
      }
    ];

    // Clear existing test users
    await Student.deleteMany({ email: { $in: testStudents.map(s => s.email) } });
    await Teacher.deleteMany({ email: { $in: testTeachers.map(t => t.email) } });

    // Create students
    for (const studentData of testStudents) {
      const student = new Student(studentData);
      await student.save();
      console.log(`✅ Created student: ${studentData.email}`);
    }

    // Create teachers
    for (const teacherData of testTeachers) {
      const teacher = new Teacher(teacherData);
      await teacher.save();
      console.log(`✅ Created teacher: ${teacherData.email}`);
    }

    console.log("🎉 Test users created successfully!");
    console.log("📝 Test Accounts:");
    console.log("   Students: student@test.com, student2@test.com");
    console.log("   Teachers: teacher@test.com, teacher2@test.com");
    console.log("   Password: password123");

  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedTestUsers();
