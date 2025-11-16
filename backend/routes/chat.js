import express from "express";
import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import { Groq } from "groq-sdk";
import OpenAI from "openai";

const router = express.Router();

// Initialize AI clients conditionally
let groq = null;
let openai = null;

if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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

    // Check if at least one AI service is configured
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
      console.error("❌ AI SERVICE ERROR: No API keys configured");
      console.error("   - OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Not set");
      console.error("   - GROQ_API_KEY:", process.env.GROQ_API_KEY ? "✅ Set" : "❌ Not set");
      console.error("   - AI_PROVIDER:", process.env.AI_PROVIDER || "Not set (default: openai)");
      return res.status(503).json({ 
        success: false, 
        message: "AI service not configured. Please set GROQ_API_KEY or OPENAI_API_KEY in .env file" 
      });
    }

    if (!isMongoDBAvailable()) {
      console.error("❌ DATABASE ERROR: MongoDB not available");
      console.error("   - Connection State:", mongoose.connection.readyState);
      console.error("   - MongoDB URI:", process.env.MONGODB_URI || "mongodb://localhost:27017/knowledgehub (default)");
      return res.status(503).json({ 
        success: false, 
        message: "Database not available" 
      });
    }

    // Generate session ID if not provided (auto-generated)
    const chatSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      let aiResponse = "I'm sorry, I couldn't generate a response. Please try again.";
      const preferredProvider = process.env.AI_PROVIDER?.toLowerCase() || "openai";
      
      // Try to get AI response - prefer OpenAI if available, fallback to Groq
      if ((preferredProvider === "openai" && openai) || (!groq && openai)) {
        // Use OpenAI
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
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
            temperature: 0.7,
            max_tokens: 1024,
          });
          aiResponse = completion.choices[0]?.message?.content || aiResponse;
        } catch (openaiError) {
          console.error("❌ OpenAI API ERROR:", openaiError.message || openaiError);
          console.error("   - Error Type:", openaiError.constructor?.name || "Unknown");
          try {
            const errorStr = JSON.stringify(openaiError, Object.getOwnPropertyNames(openaiError));
            console.error("   - Error Details:", errorStr.substring(0, 300));
          } catch {
            console.error("   - Error Details:", String(openaiError));
          }
          if (openaiError.response) {
            console.error("   - Status:", openaiError.response.status);
            console.error("   - Status Text:", openaiError.response.statusText);
          }
          if (openaiError.status) {
            console.error("   - HTTP Status:", openaiError.status);
          }
          // Fallback to Groq if OpenAI fails
          if (groq) {
            try {
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
                model: "llama-3.1-8b-instant",
                temperature: 0.7,
                max_tokens: 1024,
              });
              aiResponse = completion.choices[0]?.message?.content || aiResponse;
            } catch (groqError) {
              console.error("❌ Groq API ERROR (fallback failed):", groqError.message || groqError);
              console.error("   - Error Type:", groqError.constructor?.name || "Unknown");
              throw openaiError; // Throw original error
            }
          } else {
            throw openaiError;
          }
        }
      } else if (groq) {
        // Use Groq as fallback
        try {
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
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_tokens: 1024,
          });
          aiResponse = completion.choices[0]?.message?.content || aiResponse;
        } catch (groqError) {
          console.error("❌ Groq API ERROR:", groqError.message || groqError);
          console.error("   - Error Type:", groqError.constructor?.name || "Unknown");
          try {
            const errorStr = JSON.stringify(groqError, Object.getOwnPropertyNames(groqError));
            console.error("   - Error Details:", errorStr.substring(0, 300));
          } catch {
            console.error("   - Error Details:", String(groqError));
          }
          if (groqError.status) {
            console.error("   - HTTP Status:", groqError.status);
          }
          throw groqError;
        }
      }

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

    } catch (aiError) {
      console.error("❌ AI API ERROR (Catch Block):", aiError.message || aiError);
      console.error("   - Stack:", aiError.stack?.substring(0, 300));
      try {
        const errorStr = JSON.stringify(aiError, Object.getOwnPropertyNames(aiError));
        console.error("   - Full Error:", errorStr.substring(0, 500));
      } catch {
        console.error("   - Full Error:", String(aiError));
      }
      res.status(500).json({ 
        success: false, 
        message: "AI service temporarily unavailable. Please check your API keys in .env file.",
        error: aiError.message,
        errorType: aiError.constructor?.name || "Unknown"
      });
    }

  } catch (error) {
    console.error("❌ CHAT ERROR (General):", error.message || error);
    console.error("   - Stack:", error.stack?.substring(0, 300));
    try {
      const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error));
      console.error("   - Full Error:", errorStr.substring(0, 500));
    } catch {
      console.error("   - Full Error:", String(error));
    }
    res.status(500).json({ 
      success: false, 
      message: "Failed to process message",
      error: error.message,
      errorType: error.constructor?.name || "Unknown"
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
