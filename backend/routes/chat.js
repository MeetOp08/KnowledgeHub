import express from "express";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import Chat from "../models/Chat.js";

dotenv.config();

const router = express.Router();

let client = null;
if (process.env.GROQ_API_KEY) {
  client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  console.log("✅ Groq client initialized");
} else {
  console.error("❌ GROQ_API_KEY missing in .env");
}

// Fallback response
const generateFallbackResponse = () => {
  return "⚠️ AI service unavailable. Please try again later.";
};

// Chat route
router.post("/", async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    let reply;

    if (client) {
      try {
        const chatCompletion = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a helpful AI tutor." },
            { role: "user", content: message },
          ],
        });
        reply =
          chatCompletion.choices[0]?.message?.content || "No reply generated";
      } catch (apiError) {
        console.error("Groq API error:", apiError.message);
        reply = generateFallbackResponse();
      }
    } else {
      reply = generateFallbackResponse();
    }

    // Persist message history by session
    if (sessionId && userId) {
      let chat = await Chat.findOne({ sessionId, userId });
      if (!chat) {
        chat = new Chat({ sessionId, userId, messages: [] });
      }
      chat.messages.push({ role: "user", content: message });
      chat.messages.push({ role: "assistant", content: reply });
      await chat.save();
    }

    res.json({ reply, sessionId: sessionId || "demo-session", messageId: Date.now().toString() });
  } catch (error) {
    console.error("Error in chat route:", error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Chat history route (stub)
router.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    const chat = await Chat.findOne({ sessionId, userId });
    if (!chat) {
      return res.json({ messages: [], sessionId, userId });
    }
    return res.json({ messages: chat.messages, sessionId, userId });
  } catch (error) {
    console.error("Error in chat history route:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// Basic booking-session helper: create chat session id from booking id
router.post("/session", async (req, res) => {
  try {
    const { bookingId, userId } = req.body;
    if (!bookingId || !userId) {
      return res.status(400).json({ error: "bookingId and userId are required" });
    }
    const sessionId = `booking-${bookingId}`;
    let chat = await Chat.findOne({ sessionId, userId });
    if (!chat) {
      chat = new Chat({ sessionId, userId, messages: [] });
      await chat.save();
    }
    return res.json({ sessionId });
  } catch (error) {
    console.error("Error creating chat session:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
