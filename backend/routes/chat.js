// backend/routes/chat.js
import express from "express";
import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import OpenAI from "openai";
import { Groq } from "groq-sdk";

const router = express.Router();

let openai = null;
let groq = null;

// small helpers
const mask = (s) => (s ? (s.length > 10 ? `${s.slice(0,6)}...${s.slice(-4)}` : s) : "NOT SET");
const looksLikeRealKey = (k) => !!k && !k.includes("your-") && !k.includes("placeholder") && k.length > 20;

console.log("\n🤖 Initializing AI Services (routes/chat.js)...");

const openaiKey = process.env.OPENAI_API_KEY || "";
const groqKey = process.env.GROQ_API_KEY || "";

console.log("   OPENAI_API_KEY:", mask(openaiKey));
console.log("   GROQ_API_KEY:  ", mask(groqKey));
console.log("   AI_PROVIDER:   ", process.env.AI_PROVIDER || "openai");

try {
  if (looksLikeRealKey(openaiKey)) {
    try {
      openai = new OpenAI({ apiKey: openaiKey });
      console.log("   ✅ OpenAI client initialized");
      console.log("   → has openai.chat.completions.create:", !!openai?.chat?.completions?.create);
      console.log("   → has openai.responses.create:", !!openai?.responses?.create);
    } catch (err) {
      openai = null;
      console.error("   ❌ OpenAI initialization failed:", err?.message || err);
    }
  } else if (openaiKey) {
    console.warn("   ⚠️  OPENAI_API_KEY appears to be a placeholder/invalid value");
  } else {
    console.log("   ⚠️  OPENAI_API_KEY not provided");
  }

  if (looksLikeRealKey(groqKey)) {
    try {
      groq = new Groq({ apiKey: groqKey });
      console.log("   ✅ Groq client initialized");
    } catch (err) {
      groq = null;
      console.error("   ❌ Groq initialization failed:", err?.message || err);
    }
  } else if (groqKey) {
    console.warn("   ⚠️  GROQ_API_KEY appears to be a placeholder/invalid value");
  } else {
    console.log("   ⚠️  GROQ_API_KEY not provided");
  }
} catch (fatalErr) {
  console.error("   ❌ Unexpected error during AI init:", fatalErr);
}

if (!openai && !groq) {
  console.error("\n   ❌ CRITICAL: No AI service available after initialization!");
  console.error("   → Ensure at least ONE valid API key is provided in backend/.env and run `npm install openai groq-sdk`.\n");
} else {
  console.log("\n   ✅ At least one AI client is available.");
}

const isMongoDBAvailable = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

const getGroqResponse = async (messages) => {
  if (!groq) throw new Error("Groq client not initialized");
  const completion = await groq.chat.completions.create({
    messages,
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    temperature: parseFloat(process.env.GROQ_TEMPERATURE || "0.7"),
    max_tokens: parseInt(process.env.GROQ_MAX_TOKENS || "1024"),
  });

  return {
    success: true,
    content: completion.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.",
    provider: "groq"
  };
};

const getOpenAIResponse = async (messages) => {
  if (!openai) throw new Error("OpenAI client not initialized");

  // Try chat.completions.create (older shape)
  if (openai?.chat?.completions?.create) {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1024"),
    });

    const content = completion.choices?.[0]?.message?.content || completion.choices?.[0]?.text || "";
    return { success: true, content: content || "I'm sorry, I couldn't generate a response.", provider: "openai" };
  }

  // Try responses.create (newer shape)
  if (openai?.responses?.create) {
    const inputText = messages.map(m => `${m.role}: ${m.content}`).join("\n");
    const resp = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      input: inputText,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1024"),
    });

    let out = "";
    if (resp.output_text) out = resp.output_text;
    else if (Array.isArray(resp.output) && resp.output[0]?.content) {
      out = resp.output[0].content.map(c => c?.text || "").join("");
    } else if (resp.output?.length) {
      out = JSON.stringify(resp.output);
    } else {
      out = String(resp);
    }

    return { success: true, content: out || "I'm sorry, I couldn't generate a response.", provider: "openai" };
  }

  throw new Error("OpenAI client does not expose known chat/response methods");
};

const getAIResponse = async (messages, provider = null) => {
  const preferredProvider = (provider || process.env.AI_PROVIDER || "openai").toLowerCase();

  const systemMessage = {
    role: "system",
    content: "You are a helpful AI assistant for KnowledgeHub, an online learning platform. Help students with their questions, provide clear explanations, and guide their learning. Be friendly, encouraging, and educational."
  };

  const conversationMessages = [systemMessage, ...messages];

  if ((preferredProvider === "openai" && openai) || (!groq && openai)) {
    try {
      return await getOpenAIResponse(conversationMessages);
    } catch (err) {
      console.error("   → OpenAI call failed:", err);
      if (groq) {
        console.log("   → Falling back to Groq...");
        return await getGroqResponse(conversationMessages);
      }
      throw err;
    }
  }

  if (groq) {
    return await getGroqResponse(conversationMessages);
  }

  throw new Error("No AI service available. Please configure OPENAI_API_KEY or GROQ_API_KEY in .env file");
};

// ----- Routes -----

// Send message to AI (ChatGPT-like conversation)
router.post("/", async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        message: "Message and userId are required"
      });
    }

    const hasValidOpenAI = !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your-");
    const hasValidGroq = !!process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes("your-");

    if (!hasValidOpenAI && !hasValidGroq) {
      return res.status(503).json({
        success: false,
        message: "AI service not configured. Please set OPENAI_API_KEY or GROQ_API_KEY in .env file"
      });
    }

    if (!openai && !groq) {
      return res.status(503).json({
        success: false,
        message: "AI service initialization failed. Please check your API keys in .env file"
      });
    }

    if (!isMongoDBAvailable()) {
      return res.status(503).json({
        success: false,
        message: "Database not available. Please check MongoDB connection."
      });
    }

    const chatSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let chat = await Chat.findOne({ sessionId: chatSessionId });

    if (!chat) {
      const chatTitle = message.length > 50 ? message.substring(0, 50) + "..." : message;
      chat = new Chat({
        sessionId: chatSessionId,
        userId: userId,
        title: chatTitle,
        messages: []
      });
    }

    chat.messages.push({
      role: "user",
      content: message,
      timestamp: new Date()
    });

    const recentMessages = chat.messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const aiResponse = await getAIResponse(recentMessages);

    chat.messages.push({
      role: "assistant",
      content: aiResponse.content,
      timestamp: new Date()
    });

    await chat.save();

    res.json({
      success: true,
      reply: aiResponse.content,
      sessionId: chatSessionId,
      provider: aiResponse.provider
    });

  } catch (aiError) {
    console.error("\n❌ AI API Error in chat route:", aiError?.message || aiError);
    if (aiError.message?.includes("No AI service available")) {
      return res.status(500).json({
        success: false,
        message: "AI service not configured. Please add OPENAI_API_KEY or GROQ_API_KEY to backend/.env",
        error: aiError.message
      });
    }
    res.status(500).json({
      success: false,
      message: "AI service temporarily unavailable. Please check your API keys in .env file.",
      error: aiError.message || String(aiError)
    });
  }
});

// Get chat history for a session
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
      messages: chat.messages,
      title: chat.title
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

// Get all chat sessions for a user
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
      .sort({ updatedAt: -1 })
      .limit(50);

    const sessions = chats.map(chat => ({
      sessionId: chat.sessionId,
      title: chat.title || "New Chat",
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: chat.messages.length,
      lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].content.substring(0, 100) : ""
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

// Delete a chat session
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
