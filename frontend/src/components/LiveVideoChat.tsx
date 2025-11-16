import React, { useState, useRef, useEffect } from "react";

interface LiveVideoChatProps {
  onEndCall: () => void;
  teacherName?: string;
  studentName?: string;
  teacherAvatarUrl?: string;
  studentAvatarUrl?: string;
  meetingLink?: string;
}

const LiveVideoChat: React.FC<LiveVideoChatProps> = ({
  onEndCall,
  teacherName = "Teacher",
  studentName = "Student",
  teacherAvatarUrl,
  studentAvatarUrl,
  meetingLink
}) => {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasStream, setHasStream] = useState(false);
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    sender: string;
    message: string;
    timestamp: Date;
  }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    setChatMessages([
      {
        id: "1",
        sender: "System",
        message: `Welcome to the live session with ${teacherName ? teacherName : "Teacher"}!`,
        timestamp: new Date()
      },
      {
        id: "2",
        sender: "System",
        message: "You can use the chat to ask questions during the session.",
        timestamp: new Date()
      }
    ]);
    setTimeout(() => setIsConnected(true), 2000);
    return () => clearInterval(timer);
  }, [teacherName]);

  // Start/stop camera and microphone
  const startMedia = async (video: boolean, audio: boolean) => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { facingMode: 'user' } : false,
        audio: audio
      });
      
      localStreamRef.current = stream;
      setHasStream(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }
    } catch (err: any) {
      console.error("Error accessing media devices:", err);
      setCameraError(err.message || "Failed to access camera/microphone. Please check permissions.");
      setIsVideoOn(false);
      setIsAudioOn(false);
      setHasStream(false);
    }
  };

  const stopMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setHasStream(false);
  };

  const toggleVideo = async () => {
    if (isVideoOn) {
      // Turn off video
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => track.enabled = false);
      }
      setIsVideoOn(false);
    } else {
      // Turn on video
      if (!localStreamRef.current) {
        await startMedia(true, isAudioOn);
      } else {
        localStreamRef.current.getVideoTracks().forEach(track => track.enabled = true);
      }
      setIsVideoOn(true);
    }
  };

  const toggleAudio = async () => {
    if (isAudioOn) {
      // Turn off audio
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => track.enabled = false);
      }
      setIsAudioOn(false);
    } else {
      // Turn on audio
      if (!localStreamRef.current) {
        await startMedia(isVideoOn, true);
      } else {
        localStreamRef.current.getAudioTracks().forEach(track => track.enabled = true);
      }
      setIsAudioOn(true);
    }
  };

  const handleEndCall = () => {
    stopMedia();
    onEndCall();
  };

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
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900">
      {/* Video and participants */}
      <div className="flex-1 flex flex-col">
        {/* Header: Avatars/names */}
        <div className="flex justify-between items-center bg-gray-800 p-4">
          <div className="flex items-center gap-6">
            {/* Teacher */}
            <div className="flex items-center gap-2">
              {teacherAvatarUrl ? (
                <img src={teacherAvatarUrl} alt="avatar" className="w-12 h-12 rounded-full border" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">{teacherName[0]}</div>
              )}
              <div className="text-white font-bold text-base">{teacherName}</div>
              <span className="text-xs text-gray-400 ml-1">Teacher</span>
            </div>
            <span className="font-bold text-xl text-white mx-3">vs</span>
            {/* Student */}
            <div className="flex items-center gap-2">
              {studentAvatarUrl ? (
                <img src={studentAvatarUrl} alt="avatar" className="w-12 h-12 rounded-full border" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">{studentName[0]}</div>
              )}
              <div className="text-white font-bold text-base">{studentName}</div>
              <span className="text-xs text-gray-400 ml-1">Student</span>
            </div>
          </div>
          <button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
          >End Call</button>
        </div>
        {/* Main video area */}
        <div className="flex-1 flex flex-col items-center justify-center relative bg-gray-900">
          <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-gray-800 text-gray-200 text-xs font-bold shadow z-10">{isConnected ? "LIVE" : "Connecting..."} • {formatDuration(callDuration)}</div>
          
          {/* Video display */}
          <div className="w-full h-full flex items-center justify-center p-4 relative">
            {/* Video element - always rendered but hidden when no stream */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full max-w-4xl h-full max-h-[70vh] rounded-2xl bg-gray-800 object-cover shadow-2xl ${isVideoOn && hasStream ? 'block' : 'hidden'}`}
            />
            
            {/* Placeholder when video is off or no stream */}
            {(!isVideoOn || !hasStream) && (
              <div className="bg-gray-800 rounded-2xl p-12 flex flex-col items-center shadow-lg max-w-2xl">
                <div className="flex items-center justify-center">
                  <div className={`rounded-full bg-gradient-to-tr from-purple-500 to-blue-600 w-40 h-40 flex items-center justify-center border-4 border-purple-300 shadow-inner text-7xl text-white`}>
                    {isVideoOn ? "📹" : "📷"}
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="text-white text-2xl font-bold">Live Session</div>
                  {cameraError && (
                    <div className="text-red-400 mt-2 text-sm">{cameraError}</div>
                  )}
                  {!cameraError && !isVideoOn && (
                    <div className="text-gray-400 mt-2">Click "Cam On" to start your camera</div>
                  )}
                  <div className="text-gray-400 mt-2">{meetingLink && <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Join External Meeting</a>}</div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
            <button 
              onClick={toggleAudio} 
              className={`px-6 py-3 rounded-full font-bold transition shadow-lg ${isAudioOn ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
            >
              {isAudioOn ? '🎤 Mic On' : '🔇 Mic Off'}
            </button>
            <button 
              onClick={toggleVideo} 
              className={`px-6 py-3 rounded-full font-bold transition shadow-lg ${isVideoOn ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
            >
              {isVideoOn ? '📹 Cam On' : '📷 Cam Off'}
            </button>
            <button 
              onClick={() => setIsScreenSharing(!isScreenSharing)} 
              className={`px-6 py-3 rounded-full font-bold transition shadow-lg ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
            >
              🖥️ Share Screen
            </button>
          </div>
        </div>
      </div>
      {/* Chat panel */}
      <div className="w-full md:w-96 bg-gray-800 flex flex-col border-l border-gray-800 relative shadow-2xl">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold text-lg">Chat</h3>
        </div>
        <div ref={chatRef} className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0">
          {chatMessages.map(msg => (
            <div key={msg.id} className="text-sm">
              <div className="text-gray-300 font-medium">{msg.sender}</div>
              <div className="text-white bg-gray-700 p-2 rounded-lg mt-1">
                {msg.message}
              </div>
              <div className="text-gray-400 text-xs mt-1">{msg.timestamp.toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-bold"
            >Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveVideoChat;
