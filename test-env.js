// Quick test to verify environment variables are loaded
import dotenv from "dotenv";

dotenv.config();

console.log("=== Environment Variables Test ===");
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? `✅ Set (${process.env.OPENAI_API_KEY.substring(0, 20)}...)` : "❌ NOT SET");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? `✅ Set (${process.env.GROQ_API_KEY.substring(0, 20)}...)` : "❌ NOT SET");
console.log("AI_PROVIDER:", process.env.AI_PROVIDER || "Not set (default: openai)");
console.log("MONGO_URI:", process.env.MONGO_URI || "Not set (using default)");
console.log("MONGODB_URI:", process.env.MONGODB_URI || "Not set");

if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
  console.log("\n❌ ERROR: No AI API keys found!");
  process.exit(1);
} else {
  console.log("\n✅ At least one API key is set");
}

