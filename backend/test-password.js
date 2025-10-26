import bcrypt from "bcryptjs";

const storedPassword = "$2b$10$XYeUhUvOrj4yFZ89Pvvsl.mXDfZV3Q12XHmA2LrWa8qVVaeiYRrLu";
const testPassword = "password123";

async function testPasswordMatch() {
  try {
    const isMatch = await bcrypt.compare(testPassword, storedPassword);
    console.log(`Password match: ${isMatch}`);
    
    if (!isMatch) {
      console.log("Testing other common passwords...");
      const commonPasswords = ["password", "123456", "admin", "test", "meet123"];
      
      for (const pwd of commonPasswords) {
        const match = await bcrypt.compare(pwd, storedPassword);
        console.log(`${pwd}: ${match}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testPasswordMatch();
