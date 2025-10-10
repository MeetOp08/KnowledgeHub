import mongoose from "mongoose";
import User from "./models/User.js";
import Teacher from "./models/Teacher.js";
import Student from "./models/Student.js";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/knowledgehub";

async function migrateUsers() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Get all users from the old User collection
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to migrate`);

    let teachersMigrated = 0;
    let studentsMigrated = 0;

    for (const user of users) {
      if (user.role === "teacher") {
        // Check if teacher already exists
        const existingTeacher = await Teacher.findOne({ email: user.email });
        if (!existingTeacher) {
          const teacher = new Teacher({
            fullName: user.fullName,
            email: user.email,
            password: user.password, // Already hashed
            resetPasswordToken: user.resetPasswordToken,
            resetPasswordExpires: user.resetPasswordExpires,
            createdAt: user.createdAt || new Date(),
            updatedAt: new Date()
          });
          await teacher.save();
          teachersMigrated++;
          console.log(`✅ Migrated teacher: ${user.fullName}`);
        } else {
          console.log(`⚠️  Teacher already exists: ${user.fullName}`);
        }
      } else if (user.role === "student") {
        // Check if student already exists
        const existingStudent = await Student.findOne({ email: user.email });
        if (!existingStudent) {
          const student = new Student({
            fullName: user.fullName,
            email: user.email,
            password: user.password, // Already hashed
            resetPasswordToken: user.resetPasswordToken,
            resetPasswordExpires: user.resetPasswordExpires,
            createdAt: user.createdAt || new Date(),
            updatedAt: new Date()
          });
          await student.save();
          studentsMigrated++;
          console.log(`✅ Migrated student: ${user.fullName}`);
        } else {
          console.log(`⚠️  Student already exists: ${user.fullName}`);
        }
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   Teachers migrated: ${teachersMigrated}`);
    console.log(`   Students migrated: ${studentsMigrated}`);
    console.log(`   Total migrated: ${teachersMigrated + studentsMigrated}`);

    // Optional: Keep the old User collection for backup
    console.log("\n💡 Old User collection kept for backup. You can drop it later if everything works correctly.");

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run migration
migrateUsers();

