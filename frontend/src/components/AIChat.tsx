// frontend/src/components/AIChat.tsx
import React, { useState, useEffect, useRef } from "react";
import { Send, Trash2, MessageSquare, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
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
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get user (if you have auth); otherwise comment out this useEffect and set userId="test-user" for testing.
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user?._id || data.user?.id) {
            const uid = data.user._id || data.user.id;
            setUserId(uid);
            loadChatSessions(uid);
            return;
          }
        }
        // If not authenticated, you can set a test user id:
        // setUserId("test-user");
      } catch (err) {
        console.error("Error fetching user:", err);
        // setUserId("test-user");
      }
    };
    fetchUser();
  }, []);

  const loadChatSessions = async (uid: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${uid}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions || []);
        }
      }
    } catch (err) {
      console.error("Error loading sessions:", err);
    }
  };

  const loadChatHistory = async (sessionIdToLoad: string) => {
    if (!userId) return;
    try {
      const res = await fetch(
        `/api/chat/history/${sessionIdToLoad}?userId=${userId}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const historyMessages: Message[] = data.messages.map((msg: any, idx: number) => ({
            id: `${sessionIdToLoad}-${idx}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(historyMessages);
          setSessionId(sessionIdToLoad);
          setError(null);
        }
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInputMessage("");
    setError(null);
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !userId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage.content,
          userId,
          sessionId: sessionId || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
        }

        if (userId) {
          loadChatSessions(userId);
        }
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message. Please try again.");
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    try {
      const res = await fetch(
        `/api/chat/session/${sessionIdToDelete}?userId=${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionIdToDelete));
        if (sessionIdToDelete === sessionId) startNewChat();
      } else {
        console.error("Failed to delete session:", await res.text());
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50">
      {/* Sidebar - Chat History */}
      <div className={`${showSidebar ? "w-64" : "w-0"} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
            <button onClick={() => setShowSidebar(false)} className="text-gray-500 hover:text-gray-700">×</button>
          </div>
          <button onClick={startNewChat} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">+ New Chat</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No chat history yet</div>
          ) : (
            <div className="space-y-1 p-2">
              {sessions.map((session) => (
                <div key={session.sessionId} onClick={() => loadChatHistory(session.sessionId)} className={`p-3 rounded-lg cursor-pointer transition-colors group ${sessionId === session.sessionId ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100 text-gray-700"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{session.title}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{session.lastMessage || "No messages"}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(session.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={(e) => deleteSession(session.sessionId, e)} className="opacity-0 group-hover:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity" title="Delete chat">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!showSidebar && (
        <button onClick={() => setShowSidebar(true)} className="absolute left-4 top-24 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 z-10">
          <MessageSquare className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">AI Chat Assistant</h1>
              <p className="text-sm text-gray-500">Ask me anything!</p>
            </div>
          </div>
          {sessionId && <button onClick={startNewChat} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">New Chat</button>}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Start a conversation</h2>
              <p className="text-gray-500 mb-6">Ask me anything and I'll help you learn!</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                {["Explain quantum physics in simple terms","Help me understand calculus","What are the best study techniques?","Explain the water cycle"].map((suggestion, idx) => (
                  <button key={idx} onClick={() => { setInputMessage(suggestion); setTimeout(() => sendMessage(), 100); }} className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-sm text-gray-700">{suggestion}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === "user" ? "bg-purple-600 text-white" : "bg-white text-gray-800 border border-gray-200"}`}>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.role === "user" ? "text-purple-200" : "text-gray-400"}`}>{new Date(message.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <textarea ref={inputRef} value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message... (Shift+Enter for new line)" className="flex-1 min-h-[60px] max-h-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" rows={1} disabled={isLoading || !userId} />
              <button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading || !userId} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>) : (<><Send className="w-5 h-5" /> Send</>)}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
