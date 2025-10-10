import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Teacher from "./models/Teacher.js";

dotenv.config();

const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/knowledgehub";

async function seedTestTeacher() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    const email = "test.teacher@demo.local";
    const fullName = "Testing Teacher";
    const plainPassword = "Password123!";

    // Ensure a teacher exists in Users (used by booking endpoints)
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        fullName,
        email,
        password: plainPassword, // will be hashed by User pre-save hook
        role: "teacher",
        subjects: ["Mathematics"],
        bio: "Test teacher for demo bookings",
        experience: "5 years",
        hourlyRate: 40,
        isActive: true,
      });
      await user.save();
      console.log(`✅ Created User teacher: ${fullName} (${email})`);
    } else {
      console.log(`ℹ️  User already exists: ${email}`);
    }

    // Ensure a teacher exists in Teachers (used by teacher listing)
    let teacher = await Teacher.findOne({ email });
    if (!teacher) {
      teacher = new Teacher({
        fullName,
        email,
        password: plainPassword, // will be hashed by Teacher pre-save hook
        subjects: ["Mathematics"],
        bio: "Test teacher visible to students",
        experience: "5 years",
        hourlyRate: 40,
        rating: 4.8,
        isActive: true,
      });
      await teacher.save();
      console.log(`✅ Created Teacher document: ${fullName} (${email})`);
    } else {
      console.log(`ℹ️  Teacher document already exists: ${email}`);
    }

    console.log("🎉 Seeding complete. You can now see the testing teacher in listings and use their User ID for bookings.");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedTestTeacher();


