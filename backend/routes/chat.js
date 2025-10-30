import express from "express";
import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import { Groq } from "groq-sdk";

const router = express.Router();

// Initialize Groq client conditionally
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

// Check if MongoDB is available
const isMongoDBAvailable = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

// Send message to AI
router.post("/", async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Message and userId are required" 
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ 
        success: false, 
        message: "AI service not configured" 
      });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: "Database not available" 
      });
    }

    // Generate session ID if not provided
    const chatSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get AI response from Groq
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful AI tutor for KnowledgeHub, an online learning platform. Help students with their questions, provide explanations, and guide their learning. Be friendly, encouraging, and educational."
          },
          {
            role: "user",
            content: message
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 1024,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

      // Save chat to database
      let chat = await Chat.findOne({ sessionId: chatSessionId });
      
      if (!chat) {
        // Generate title from first message (truncate to 50 chars)
        const chatTitle = message.length > 50 ? message.substring(0, 50) + "..." : message;
        
        chat = new Chat({
          sessionId: chatSessionId,
          userId: userId,
          title: chatTitle,
          messages: []
        });
      }

      // Add user message
      chat.messages.push({
        role: "user",
        content: message,
        timestamp: new Date()
      });

      // Add AI response
      chat.messages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: new Date()
      });

      await chat.save();

      res.json({
        success: true,
        reply: aiResponse,
        sessionId: chatSessionId
      });

    } catch (groqError) {
      console.error("Groq API error:", groqError);
      res.status(500).json({ 
        success: false, 
        message: "AI service temporarily unavailable" 
      });
    }

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process message",
      error: error.message 
    });
  }
});

// Get chat history
router.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    if (!sessionId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Session ID and userId are required" 
      });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: "Database not available" 
      });
    }

    const chat = await Chat.findOne({ 
      sessionId: sessionId,
      userId: userId 
    });

    if (!chat) {
      return res.json({
        success: true,
        messages: []
      });
    }

    res.json({
      success: true,
      messages: chat.messages
    });

  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch chat history",
      error: error.message 
    });
  }
});

// Get all chat sessions for user
router.get("/sessions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "UserId is required" 
      });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: "Database not available" 
      });
    }

    const chats = await Chat.find({ userId: userId })
      .select("sessionId title createdAt updatedAt messages")
      .sort({ updatedAt: -1 });

    const sessions = chats.map(chat => ({
      sessionId: chat.sessionId,
      title: chat.title || "New Chat",
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: chat.messages.length,
      lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].content : ""
    }));

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error("Get chat sessions error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch chat sessions",
      error: error.message 
    });
  }
});

// Delete chat session
router.delete("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    if (!sessionId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Session ID and userId are required" 
      });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({ 
        success: false, 
        message: "Database not available" 
      });
    }

    const result = await Chat.deleteOne({ 
      sessionId: sessionId,
      userId: userId 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Chat session not found" 
      });
    }

    res.json({
      success: true,
      message: "Chat session deleted successfully"
    });

  } catch (error) {
    console.error("Delete chat session error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete chat session",
      error: error.message 
    });
  }
});

export default router;
