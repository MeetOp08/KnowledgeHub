import React, { useState, useRef, useEffect } from "react";

interface LiveVideoChatProps {
  onEndCall: () => void;
  teacherName?: string;
  studentName?: string;
  meetingLink?: string;
}

const LiveVideoChat: React.FC<LiveVideoChatProps> = ({ 
  onEndCall, 
  teacherName = "Teacher", 
  meetingLink
}) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: string;
    message: string;
    timestamp: Date;
  }>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start call duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Add welcome messages
    setChatMessages([
      {
        id: "1",
        sender: "System",
        message: `Welcome to the live session with ${teacherName}!`,
        timestamp: new Date()
      },
      {
        id: "2", 
        sender: "System",
        message: "You can use the chat to ask questions during the session.",
        timestamp: new Date()
      }
    ]);

    // Simulate connection after 2 seconds
    setTimeout(() => {
      setIsConnected(true);
    }, 2000);

    return () => clearInterval(timer);
  }, [teacherName]);

  useEffect(() => {
    // Scroll chat to bottom when new messages arrive
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        sender: "You",
        message: newMessage.trim(),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Video Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div className="text-white">
            <h2 className="text-xl font-semibold">Live Session</h2>
            <p className="text-sm text-gray-300">
              {teacherName} • {formatDuration(callDuration)}
            </p>
          </div>
          <button
            onClick={onEndCall}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            End Call
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 bg-gray-800 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gray-700 rounded-lg p-8 text-center">
              <div className="w-32 h-32 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl text-white">📹</span>
              </div>
              <p className="text-white text-lg">{teacherName}</p>
              <p className="text-gray-300 text-sm">
                {isConnected ? "Video Call in Progress" : "Connecting..."}
              </p>
              {meetingLink && (
                <div className="mt-4">
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    Join External Meeting
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gray-800 rounded-full p-4 flex space-x-4">
              <button
                onClick={() => setIsAudioOn(!isAudioOn)}
                className={`p-3 rounded-full transition ${
                  isAudioOn ? 'bg-gray-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {isAudioOn ? '🎤' : '🔇'}
              </button>
              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-3 rounded-full transition ${
                  isVideoOn ? 'bg-gray-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {isVideoOn ? '📹' : '📷'}
              </button>
              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`p-3 rounded-full transition ${
                  isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
                }`}
              >
                🖥️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-80 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Chat</h3>
        </div>

        <div 
          ref={chatRef}
          className="flex-1 p-4 overflow-y-auto space-y-3"
        >
          {chatMessages.map((msg) => (
            <div key={msg.id} className="text-sm">
              <div className="text-gray-300 font-medium">{msg.sender}</div>
              <div className="text-white bg-gray-700 p-2 rounded-lg mt-1">
                {msg.message}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveVideoChat;
