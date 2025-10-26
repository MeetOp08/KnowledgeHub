import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/knowledgehub";

async function testMongoConnection() {
  try {
    console.log("🔗 Testing MongoDB connection...");
    console.log(`URI: ${mongoURI}`);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    console.log("✅ MongoDB connected successfully!");
    console.log(`Connection state: ${mongoose.connection.readyState}`);
    console.log(`Database name: ${mongoose.connection.db.databaseName}`);
    
    // Test if we can access collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📋 Available collections:", collections.map(c => c.name));
    
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("💡 This explains why the system is using file-based storage");
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

testMongoConnection();
