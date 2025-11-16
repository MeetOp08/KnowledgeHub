import React, { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, BookOpen, Calculator, Lightbulb, Clock, ArrowLeft, Plus, MessageSquare, Trash2, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

// Use Vite proxy in dev; override with VITE_API_URL in prod if needed
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [aiServiceConfigured, setAiServiceConfigured] = useState<boolean | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const quickActions = [
    { icon: Calculator, text: "Solve Math Problem", color: "from-blue-500 to-blue-600" },
    { icon: BookOpen, text: "Explain Concept", color: "from-green-500 to-green-600" },
    { icon: Lightbulb, text: "Get Study Tips", color: "from-purple-500 to-purple-600" },
    { icon: Clock, text: "Create Study Plan", color: "from-orange-500 to-orange-600" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions
  const loadChatSessions = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/sessions/${userId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sessions) {
          setChatSessions(data.sessions);
        }
      }
    } catch (err) {
      console.error("Error loading chat sessions:", err);
    }
  };

  // Load specific chat session
  const loadChatSession = async (sessionIdToLoad: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/history/${sessionIdToLoad}?userId=${userId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          const loaded = data.messages.map((m: any) => ({
            id: m._id || crypto.randomUUID(),
            type: m.role === "user" ? "user" : "ai",
            content: m.content,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(loaded);
          setSessionId(sessionIdToLoad);
          localStorage.setItem("chatSessionId", sessionIdToLoad);
        }
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  // Create new chat
  const createNewChat = () => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setMessages([]);
    localStorage.setItem("chatSessionId", newSessionId);
    loadChatSessions(); // Refresh list
  };

  // Get current user info and init session + load history
  useEffect(() => {
    const initializeChat = async () => {
      // Get current user info
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          // Try to get userId from different possible locations
          const fetchedUserId = userData.user?.id || 
                               userData.user?._id || 
                               userData.user?.userId ||
                               userData.id ||
                               (userData.user && userData.user.toString()) ||
                               `user_${Date.now()}`;
          setUserId(fetchedUserId);

          // Load chat sessions
          await loadChatSessions();

          // Initialize current session
          let storedSession = localStorage.getItem("chatSessionId");
          if (!storedSession) {
            storedSession = crypto.randomUUID();
            localStorage.setItem("chatSessionId", storedSession);
          }
          setSessionId(storedSession);

          // Load current session history if it exists
          if (fetchedUserId) {
            await loadChatSession(storedSession);
          }
        } else {
          // If not authenticated, try to get from student dashboard data
          try {
            const dashboardRes = await fetch(`${API_BASE_URL}/api/student/dashboard/data`, {
              credentials: 'include',
            });
            if (dashboardRes.ok) {
              const dashboardData = await dashboardRes.json();
              const fetchedUserId = dashboardData.student?.id || 
                                   dashboardData.student?._id ||
                                   `student_${Date.now()}`;
              setUserId(fetchedUserId);
              
              // Initialize session
              let storedSession = localStorage.getItem("chatSessionId");
              if (!storedSession) {
                storedSession = crypto.randomUUID();
                localStorage.setItem("chatSessionId", storedSession);
              }
              setSessionId(storedSession);
              
              if (fetchedUserId) {
                await loadChatSessions();
                await loadChatSession(storedSession);
              }
            }
          } catch (err) {
            console.error("Error fetching dashboard data:", err);
            // Fallback to a default userId if all fails
            const fallbackId = `student_${Date.now()}`;
            setUserId(fallbackId);
          }
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        // Fallback to a default userId
        const fallbackId = `student_${Date.now()}`;
        setUserId(fallbackId);
      }
    };

    initializeChat();
  }, []);

  // Check AI service status when component mounts and userId is available
  useEffect(() => {
    if (userId) {
      checkAIServiceStatus();
    }
  }, [userId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || !userId) {
      if (!userId) {
        alert("User not authenticated. Please refresh the page.");
      }
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ message: userMessage.content, userId, sessionId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        
        console.error("❌ API Response Error:", {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });
        
        // Check if AI service is not configured
        if (res.status === 503 && errorData.message?.includes("AI service not configured")) {
          setAiServiceConfigured(false);
          setErrorDetails(`Status: ${res.status}\nMessage: ${errorData.message}\nError: ${errorData.error || "N/A"}`);
          throw new Error(errorData.message || "AI service is not configured");
        }
        
        // Store error details for display
        setErrorDetails(`Status: ${res.status} ${res.statusText}\nMessage: ${errorData.message || "Unknown error"}\nError Type: ${errorData.errorType || "N/A"}\nError: ${errorData.error || "N/A"}`);
        
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.reply || data.message || "⚠️ AI didn't respond.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      
      // Update session ID if returned from server
      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem("chatSessionId", data.sessionId);
      }
      
      // Refresh chat sessions to update the list
      loadChatSessions();
    } catch (err: any) {
      console.error("❌ AIChat Error:", err);
      console.error("   - Error Type:", err.constructor?.name || "Unknown");
      console.error("   - Error Message:", err.message);
      console.error("   - Error Stack:", err.stack);
      console.error("   - Full Error Object:", err);
      
      const errorMessage = err.message || "Something went wrong. Please try again later.";
      const detailedError = err.response?.error || err.error || err.message || "Unknown error";
      
      setErrorDetails(detailedError);
      setAiServiceConfigured(false);
      
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 2).toString(), 
          type: "ai", 
          content: `⚠️ Error: ${errorMessage}`, 
          timestamp: new Date() 
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (text: string) => {
    setInputMessage(text);
  };

  // Delete chat session
  const deleteChatSession = async (sessionIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the session when clicking delete
    
    if (!userId || !window.confirm("Are you sure you want to delete this chat?")) {
      return;
    }

    setDeletingSessionId(sessionIdToDelete);
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/session/${sessionIdToDelete}?userId=${userId}`, {
        method: "DELETE",
        credentials: 'include'
      });

      if (res.ok) {
        // Remove from local state
        setChatSessions(prev => prev.filter(s => s.sessionId !== sessionIdToDelete));
        
        // If deleted session was the current one, create new chat
        if (sessionId === sessionIdToDelete) {
          createNewChat();
        }
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to delete chat" }));
        alert(`Error: ${errorData.message || "Failed to delete chat session"}`);
      }
    } catch (err) {
      console.error("Error deleting chat session:", err);
      alert("Error deleting chat session. Please try again.");
    } finally {
      setDeletingSessionId(null);
    }
  };

  // Check AI service status
  const checkAIServiceStatus = async () => {
    try {
      console.log("🔍 Checking AI service status...");
      // Try a test request to check if AI service is configured
      // We'll catch the error response without creating a session
      const testRes = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ 
          message: "", // Empty message will trigger validation error, not AI call
          userId: userId || "test-check",
          sessionId: null
        }),
      });

      const testData = await testRes.json().catch(() => ({}));
      
      console.log("🔍 AI Service Check Response:", {
        status: testRes.status,
        data: testData
      });
      
      // If we get 503 with AI service not configured message, service is down
      if (testRes.status === 503 && testData.message?.includes("AI service not configured")) {
        console.error("❌ AI Service Not Configured");
        setAiServiceConfigured(false);
        setErrorDetails(`Status: ${testRes.status}\nMessage: ${testData.message || "AI service not configured"}`);
      } else if (testRes.status === 400 && testData.message?.includes("Message")) {
        // If we get validation error (400), it means the endpoint is reachable
        // We need to actually check by trying with a real message but catching early
        // For now, assume it's configured if we don't get the 503 error
        console.log("✅ AI Service appears to be configured");
        setAiServiceConfigured(true);
        setErrorDetails(null);
      } else {
        // Any other response suggests service might be available
        console.log("✅ AI Service appears to be available");
        setAiServiceConfigured(true);
        setErrorDetails(null);
      }
    } catch (err: any) {
      console.error("❌ AI Service Check Error:", err);
      console.error("   - Error Message:", err.message);
      console.error("   - Error Type:", err.constructor?.name || "Unknown");
      
      // Network errors or 503 status likely means service not configured
      if (err.message?.includes("503") || err.message?.includes("not configured")) {
        setAiServiceConfigured(false);
        setErrorDetails(`Network/Service Error: ${err.message || "Could not reach AI service"}`);
      } else {
        // Assume configured on other errors (could be network issue)
        setAiServiceConfigured(null);
        setErrorDetails(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Sidebar - Previous Chats */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ←
            </button>
          </div>
          <button
            onClick={createNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {chatSessions.map((session) => (
            <div
              key={session.sessionId}
              className={`relative group w-full text-left p-3 rounded-lg mb-2 transition-colors border ${
                sessionId === session.sessionId 
                  ? 'bg-blue-100 border-blue-500 border-2' 
                  : 'hover:bg-gray-100 border-gray-200'
              }`}
            >
              <button
                onClick={() => loadChatSession(session.sessionId)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-2 pr-6">
                  <MessageSquare className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{session.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {session.messageCount} messages
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(session.updatedAt).toLocaleDateString()} {new Date(session.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => deleteChatSession(session.sessionId, e)}
                disabled={deletingSessionId === session.sessionId}
                className={`absolute top-2 right-2 p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors ${
                  deletingSessionId === session.sessionId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Delete chat"
              >
                {deletingSessionId === session.sessionId ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
          {chatSessions.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No previous chats. Start a new conversation!
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => navigate("/")} 
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
              </button>
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  →
                </button>
              )}
            </div>

            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">🤖 AI Study Assistant</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Powered by OpenAI GPT • Get instant help with your studies, solve problems, and learn better with our AI-powered assistant
              </p>
              {aiServiceConfigured === false ? (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm border border-red-300">
                  <AlertCircle className="h-4 w-4" />
                  AI Service Not Configured
                </div>
              ) : aiServiceConfigured === true ? (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  AI Ready
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  Checking Status...
                </div>
              )}
            </div>
          </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Quick Actions */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => handleQuickAction(action.text)}
                  className={`p-4 rounded-xl text-white text-sm font-medium transition-all transform hover:scale-105 hover:shadow-lg bg-gradient-to-r ${action.color}`}
                >
                  <action.icon className="h-5 w-5 mx-auto mb-2" />
                  <span className="block">{action.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-6 bg-gray-50">
            {aiServiceConfigured === false && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-1">AI Service Not Configured</h4>
                    <p className="text-sm text-red-700">
                      The AI service is not available. Please ensure that either OPENAI_API_KEY or GROQ_API_KEY is set in the backend .env file.
                    </p>
                    {errorDetails && (
                      <>
                        <button
                          onClick={() => setShowErrorDetails(!showErrorDetails)}
                          className="text-xs text-red-600 hover:text-red-800 underline mt-2 flex items-center gap-1"
                        >
                          {showErrorDetails ? "▼ Hide" : "▶ Show"} Error Details
                          <span className="text-red-400">(Check browser console for full details)</span>
                        </button>
                        {showErrorDetails && (
                          <div className="mt-2 p-3 bg-red-100 rounded border border-red-300">
                            <div className="text-xs text-red-800 font-mono whitespace-pre-wrap break-words">
                              {errorDetails}
                            </div>
                            <p className="text-xs text-red-600 mt-2">
                              💡 Tip: Open browser DevTools (F12) → Console tab to see detailed error logs
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-700">
                      <strong>Quick Fix:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Open backend/.env file</li>
                        <li>Add your OpenAI API key: <code className="bg-red-200 px-1 rounded">OPENAI_API_KEY=sk-...</code></li>
                        <li>Or add Groq API key: <code className="bg-red-200 px-1 rounded">GROQ_API_KEY=gsk_...</code></li>
                        <li>Restart the backend server</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Start a conversation</h3>
                <p className="text-gray-500">Ask me anything about your studies or use the quick actions above</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex items-start space-x-4 ${msg.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.type === "user" 
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg" 
                      : "bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg"
                  }`}>
                    {msg.type === "user" ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>
                  
                  <div className={`max-w-3xl ${msg.type === "user" ? "ml-auto" : ""}`}>
                    <div className={`p-4 rounded-2xl shadow-sm ${
                      msg.type === "user" 
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white" 
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown 
                          className={`${
                            msg.type === "user" 
                              ? "prose-invert" 
                              : "prose-gray"
                          }`}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                            code: ({ children }) => (
                              <code className={`px-2 py-1 rounded text-xs font-mono ${
                                msg.type === "user" 
                                  ? "bg-blue-600 text-blue-100" 
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className={`p-3 rounded-lg text-xs font-mono overflow-x-auto ${
                                msg.type === "user" 
                                  ? "bg-blue-600 text-blue-100" 
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {children}
                              </pre>
                            ),
                            strong: ({ children }) => (
                              <strong className={`font-semibold ${
                                msg.type === "user" ? "text-blue-100" : "text-gray-800"
                              }`}>
                                {children}
                              </strong>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    
                    <p className={`text-xs mt-2 px-1 ${
                      msg.type === "user" ? "text-blue-400 text-right" : "text-gray-500"
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">OpenAI is processing your request...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text" 
                value={inputMessage} 
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={aiServiceConfigured === false ? "AI service not configured..." : "Ask me anything about your studies..."}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isTyping || aiServiceConfigured === false}
              />
              <button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isTyping || aiServiceConfigured === false}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                title={aiServiceConfigured === false ? "AI service is not configured" : ""}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Powered by OpenAI GPT-3.5 • Responses typically take 2-5 seconds
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;