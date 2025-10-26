import React, { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, BookOpen, Calculator, Lightbulb, Clock, ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

// Use Vite proxy in dev; override with VITE_API_URL in prod if needed
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("student123"); // Will be updated with actual user ID

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

  // Get current user info and init session + load history
  useEffect(() => {
    // Get current user info
    const fetchUserInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUserId(userData.user?.id || "student123");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    fetchUserInfo();

    // Initialize session
    let storedSession = localStorage.getItem("chatSessionId");
    if (!storedSession) {
      storedSession = crypto.randomUUID();
      localStorage.setItem("chatSessionId", storedSession);
    }
    setSessionId(storedSession);

    // Load chat history
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/history/${storedSession}?userId=${userId}`, {
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
          }
        }
      } catch (err) {
        console.error("Error loading history:", err);
      }
    };

    loadHistory();
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

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

      const data = await res.json();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.reply || "⚠️ AI didn't respond.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 2).toString(), type: "ai", content: "⚠️ Something went wrong. Try again later.", timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (text: string) => {
    setInputMessage(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate("/")} 
            className="mb-4 flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">🤖 AI Study Assistant</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get instant help with your studies, solve problems, and learn better with our AI-powered assistant
            </p>
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
                  <p className="text-xs text-gray-500 mt-2">AI is thinking...</p>
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
                placeholder="Ask me anything about your studies..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isTyping}
              />
              <button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isTyping}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • AI responses may take a few seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;