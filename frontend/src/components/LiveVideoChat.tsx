import React, { useState, useRef, useEffect, useMemo } from "react";
import { io, Socket } from "socket.io-client";

export type LiveSessionRecording = {
  id: string;
  filename: string;
  duration: number;
  createdAt: string;
  mimeType: string;
  dataUrl: string;
};

interface LiveVideoChatProps {
  onEndCall: () => void;
  teacherName?: string;
  studentName?: string;
  teacherAvatarUrl?: string;
  studentAvatarUrl?: string;
  meetingLink?: string;
  roomId?: string;
  currentUserName?: string;
  onRecordingReady?: (recording: LiveSessionRecording) => void;
}

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || "http://localhost:5000";
const TURN_URL = import.meta.env.VITE_TURN_URL;
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME;
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

if (TURN_URL && TURN_USERNAME && TURN_CREDENTIAL) {
  ICE_SERVERS.push({
    urls: TURN_URL,
    username: TURN_USERNAME,
    credential: TURN_CREDENTIAL,
  });
}

type RecordingEntry = {
  id: string;
  url: string;
  filename: string;
  duration: number;
  createdAt: Date;
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to encode recording."));
    reader.readAsDataURL(blob);
  });

const LiveVideoChat: React.FC<LiveVideoChatProps> = ({
  onEndCall,
  teacherName = "Teacher",
  studentName = "Student",
  teacherAvatarUrl,
  studentAvatarUrl,
  meetingLink,
  roomId,
  currentUserName,
  onRecordingReady
}) => {
  const baseName = currentUserName ?? studentName ?? "Participant";
  const activeUserName = baseName.trim() || "Participant";
  const derivedRoomId = useMemo(() => {
    if (roomId?.trim()) return roomId.trim();
    if (meetingLink) {
      const sanitized = meetingLink.replace(/[^a-zA-Z0-9]/g, "");
      if (sanitized) return `room-${sanitized}`;
    }
    return "knowledgehub-live-room";
  }, [roomId, meetingLink]);

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
  const [remoteHasStream, setRemoteHasStream] = useState(false);
  const [systemStatus, setSystemStatus] = useState("Waiting for participant...");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);

  const chatRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingDurationRef = useRef(0);

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
    return () => clearInterval(timer);
  }, [teacherName]);

  useEffect(() => {
    const socket = io(SIGNALING_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });
    socketRef.current = socket;
    setSystemStatus("Preparing devices...");

    ensureLocalStream().catch((error) => console.error("Media init error:", error));

    const handleExistingParticipants = ({ participants }: { participants?: string[] }) => {
      const [firstParticipant] = participants || [];
      if (firstParticipant) {
        setSystemStatus("Participant found. Starting call...");
        initiateOffer(firstParticipant);
      } else {
        setSystemStatus("Waiting for another participant...");
      }
    };

    const handleUserJoined = ({ socketId, userName }: { socketId: string; userName?: string }) => {
      if (remoteSocketIdRef.current && remoteSocketIdRef.current !== socketId) return;
      setSystemStatus(`${userName || "Participant"} joined. Establishing call...`);
      initiateOffer(socketId);
    };

    const handleUserLeft = () => {
      if (mediaRecorderRef.current) {
        stopRecording();
      }
      setSystemStatus("Participant left. Waiting for reconnection...");
      cleanupPeerConnection();
    };

    const handleChatMessage = ({ sender, message, timestamp }: { sender: string; message: string; timestamp: number }) => {
      if (sender === activeUserName) return;
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${timestamp}-${Math.random()}`,
          sender,
          message,
          timestamp: new Date(timestamp),
        },
      ]);
    };

    socket.on("connect", () => {
      socket.emit("join-room", { roomId: derivedRoomId, userName: activeUserName });
      setSystemStatus("Joining room...");
    });

    socket.on("existing-participants", handleExistingParticipants);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("offer", ({ from, sdp }) => handleRemoteOffer(sdp, from));
    socket.on("answer", ({ from, sdp }) => {
      remoteSocketIdRef.current = from;
      handleRemoteAnswer(sdp);
    });
    socket.on("ice-candidate", ({ from, candidate }) => {
      if (from) {
        remoteSocketIdRef.current = from;
      }
      handleRemoteCandidate(candidate);
    });
    socket.on("chat-message", handleChatMessage);

    socket.on("disconnect", () => {
      setSystemStatus("Disconnected. Retrying...");
      cleanupPeerConnection();
    });

    socket.on("connect_error", (error) => {
      console.error("Socket error:", error);
      setSystemStatus("Unable to connect to signaling server.");
    });

    return () => {
      socket.off("existing-participants", handleExistingParticipants);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("chat-message", handleChatMessage);
      socket.disconnect();
      cleanupPeerConnection();
    };
  }, [derivedRoomId, activeUserName]);

  const syncTracksWithPeer = (stream: MediaStream) => {
    const peer = peerRef.current;
    if (!peer) return;
    stream.getTracks().forEach((track) => {
      const sender = peer.getSenders().find((s) => s.track?.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track);
      } else {
        peer.addTrack(track, stream);
      }
    });
  };

  const ensureLocalStream = async () => {
    if (!localStreamRef.current) {
      await startMedia(true, true);
      setIsVideoOn(true);
      setIsAudioOn(true);
    }
  };

  // Start/stop camera and microphone
  const startMedia = async (video: boolean, audio: boolean) => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { facingMode: 'user' } : false,
        audio: audio
      });

      stream.getVideoTracks().forEach(track => {
        track.enabled = !!video;
      });
      stream.getAudioTracks().forEach(track => {
        track.enabled = !!audio;
      });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      localStreamRef.current = stream;
      setHasStream(true);

      syncTracksWithPeer(stream);

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
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
      setIsScreenSharing(false);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setHasStream(false);
    setIsVideoOn(false);
    setIsAudioOn(false);
  };

  const buildRecordingStream = () => {
    const remoteStream = remoteStreamRef.current;
    if (!remoteStream) return null;
    const merged = new MediaStream();
    remoteStream.getTracks().forEach(track => merged.addTrack(track));
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => merged.addTrack(track.clone()));
    }
    return merged;
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    const stream = buildRecordingStream();
    if (!stream) {
      setSystemStatus("Recording unavailable until the session is live.");
      return;
    }
    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType });
        const createdAt = new Date();
        const filename = `session-${createdAt.toISOString().replace(/[:.]/g, "-")}.webm`;
        const url = URL.createObjectURL(blob);
        const duration = recordingDurationRef.current;
        setRecordings((prev) => [
          ...prev,
          {
            id: createdAt.getTime().toString(),
            url,
            filename,
            duration,
            createdAt,
          },
        ]);
        recordingChunksRef.current = [];
        setRecordingDuration(0);
        recordingDurationRef.current = 0;
        if (onRecordingReady) {
          try {
            const dataUrl = await blobToDataUrl(blob);
            onRecordingReady({
              id: createdAt.getTime().toString(),
              filename,
              duration,
              createdAt: createdAt.toISOString(),
              mimeType: recorder.mimeType,
              dataUrl,
            });
          } catch (error) {
            console.error("Failed to export recording:", error);
          }
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const next = prev + 1;
          recordingDurationRef.current = next;
          return next;
        });
      }, 1000);
      setSystemStatus("Recording in progress...");
    } catch (error) {
      console.error("Failed to start recording:", error);
      setSystemStatus("This browser does not support recording.");
      stream.getTracks().forEach(track => track.stop());
    }
  };

  function stopRecording() {
    if (!mediaRecorderRef.current) return;
    try {
      mediaRecorderRef.current.stop();
    } catch (err) {
      console.warn("Recorder stop error:", err);
    }
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    mediaRecorderRef.current = null;
    stopRecordingTimer();
    setIsRecording(false);
    setSystemStatus("Recording saved.");
  }

  const downloadRecording = (recording: RecordingEntry) => {
    const link = document.createElement("a");
    link.href = recording.url;
    link.download = recording.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cleanupPeerConnection = () => {
    if (mediaRecorderRef.current) {
      stopRecording();
    }
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
    }
    peerRef.current = null;
    remoteSocketIdRef.current = null;
    setRemoteHasStream(false);
    setIsConnected(false);
    remoteStreamRef.current = null;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const createPeerConnection = () => {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteStream) {
        remoteStreamRef.current = remoteStream;
        remoteStream.onremovetrack = () => {
          setRemoteHasStream(false);
        };
      }
      setRemoteHasStream(true);
      setSystemStatus("Participant connected.");
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && remoteSocketIdRef.current) {
        socketRef.current?.emit("ice-candidate", {
          targetId: remoteSocketIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") {
        setIsConnected(true);
      }
      if (state === "disconnected" || state === "failed") {
        setIsConnected(false);
        setSystemStatus("Connection lost. Reconnecting...");
      }
    };

    if (localStreamRef.current) {
      syncTracksWithPeer(localStreamRef.current);
    }

    peerRef.current = peer;
    return peer;
  };

  const initiateOffer = async (targetId: string) => {
    try {
      await ensureLocalStream();
      const peer = createPeerConnection();
      remoteSocketIdRef.current = targetId;
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current?.emit("offer", { targetId, sdp: offer });
      setSystemStatus("Sending call invitation...");
    } catch (error) {
      console.error("Failed to create offer:", error);
      setSystemStatus("Unable to start call.");
    }
  };

  const handleRemoteOffer = async (sdp: RTCSessionDescriptionInit, fromId: string) => {
    try {
      await ensureLocalStream();
      const peer = createPeerConnection();
      remoteSocketIdRef.current = fromId;
      await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketRef.current?.emit("answer", { targetId: fromId, sdp: answer });
      setSystemStatus("Connecting to participant...");
    } catch (error) {
      console.error("Failed to handle offer:", error);
    }
  };

  const handleRemoteAnswer = async (sdp: RTCSessionDescriptionInit) => {
    try {
      const peer = peerRef.current;
      if (!peer) return;
      await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      setSystemStatus("Participant connected.");
    } catch (error) {
      console.error("Failed to handle answer:", error);
    }
  };

  const handleRemoteCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      const peer = peerRef.current;
      if (!peer) return;
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Failed to add ICE candidate:", error);
    }
  };


  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;
      screenTrackRef.current = screenTrack;
      const sender = peerRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }
      screenTrack.onended = () => stopScreenShare();
      setIsScreenSharing(true);
    } catch (error) {
      console.error("Screen share failed:", error);
    }
  };

  const stopScreenShare = async () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = peerRef.current?.getSenders().find((s) => s.track?.kind === "video");
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (sender && videoTrack) {
      await sender.replaceTrack(videoTrack);
    }
    setIsScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await ensureLocalStream();
      await startScreenShare();
    }
  };

  const toggleVideo = async () => {
    if (isVideoOn) {
      // Turn off video
      if (isScreenSharing) {
        await stopScreenShare();
      }
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

  const handleEndCall = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    }
    socketRef.current?.disconnect();
    cleanupPeerConnection();
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
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    const message = {
      id: Date.now().toString(),
      sender: "You",
      message: trimmed,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, message]);
    socketRef.current?.emit("chat-message", {
      roomId: derivedRoomId,
      sender: activeUserName,
      message: trimmed
    });
    setNewMessage("");
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#05060a] text-white overflow-hidden">
      {/* Live stage */}
      <div className="flex-1 flex flex-col relative">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {teacherAvatarUrl ? (
                <img src={teacherAvatarUrl} alt="avatar" className="w-12 h-12 rounded-full border border-white/30" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-fuchsia-600/70 text-white flex items-center justify-center font-bold text-lg">
                  {teacherName[0]}
                </div>
              )}
              <div>
                <div className="font-semibold text-base">{teacherName}</div>
                <div className="text-xs text-white/60 uppercase tracking-widest">Teacher</div>
              </div>
            </div>
            <span className="text-white/50 font-semibold text-sm">vs</span>
            <div className="flex items-center gap-2">
              {studentAvatarUrl ? (
                <img src={studentAvatarUrl} alt="avatar" className="w-12 h-12 rounded-full border border-white/30" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-sky-600/70 text-white flex items-center justify-center font-bold text-lg">
                  {studentName[0]}
                </div>
              )}
              <div>
                <div className="font-semibold text-base">{studentName}</div>
                <div className="text-xs text-white/60 uppercase tracking-widest">Student</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto text-xs uppercase tracking-[0.2em] text-white/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isConnected ? "LIVE SESSION" : "CONNECTING"}</span>
            <span className="text-white/40">• {formatDuration(callDuration)}</span>
          </div>
          <button
            onClick={handleEndCall}
            className="ml-auto lg:ml-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg"
          >
            End Call
          </button>
        </div>

        <div className="flex-1 relative p-6">
          <div className="absolute top-8 left-8 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur border border-white/10 shadow-lg">
            <div className="text-sm font-semibold">{systemStatus}</div>
            <div className="text-xs text-white/60 mt-1">
              Room: <span className="font-mono text-white/80">{derivedRoomId}</span>
            </div>
          </div>
          <div className="absolute top-8 right-8 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-xs font-semibold tracking-wide">
            {isRecording ? `⏺ Recording • ${formatDuration(recordingDuration)}` : "Ready to capture"}
          </div>

          <div className="relative h-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-black overflow-hidden shadow-2xl border border-white/5">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${remoteHasStream ? "opacity-100" : "opacity-0"}`}
            />

            {!remoteHasStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-center px-8">
                <div className="rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 w-44 h-44 flex items-center justify-center border-4 border-white/30 shadow-inner text-7xl">
                  {cameraError ? "⚠️" : "⏳"}
                </div>
                <div>
                  <p className="text-2xl font-bold">Waiting for participant</p>
                  <p className="text-white/70 mt-2">{systemStatus}</p>
                  {cameraError && <p className="text-rose-300 mt-3 text-sm">{cameraError}</p>}
                  {!cameraError && !isVideoOn && (
                    <p className="text-white/60 mt-3 text-sm">Enable your camera to join the stage.</p>
                  )}
                  {meetingLink && (
                    <a
                      href={meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-4 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold"
                    >
                      Open external meeting
                    </a>
                  )}
                </div>
              </div>
            )}

            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute bottom-6 right-6 w-60 h-40 rounded-2xl border-4 border-white/20 bg-black/40 object-cover shadow-xl transition ${isVideoOn && hasStream ? "opacity-100" : "opacity-0"}`}
            />
            {(!isVideoOn || !hasStream) && (
              <div className="absolute bottom-6 right-6 w-60 h-40 rounded-2xl bg-black/60 border border-white/10 text-white/70 flex items-center justify-center text-xs tracking-wide uppercase">
                Camera preview off
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={toggleAudio}
              className={`px-6 py-3 rounded-full font-semibold shadow-lg transition ${
                isAudioOn ? "bg-white/10 hover:bg-white/20" : "bg-rose-600/80 hover:bg-rose-600"
              }`}
            >
              {isAudioOn ? "🎤 Mic On" : "🔇 Mic Off"}
            </button>
            <button
              onClick={toggleVideo}
              className={`px-6 py-3 rounded-full font-semibold shadow-lg transition ${
                isVideoOn ? "bg-white/10 hover:bg-white/20" : "bg-rose-600/80 hover:bg-rose-600"
              }`}
            >
              {isVideoOn ? "📹 Cam On" : "📷 Cam Off"}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`px-6 py-3 rounded-full font-semibold shadow-lg transition ${
                isScreenSharing ? "bg-sky-600/80 hover:bg-sky-500" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              🖥️ {isScreenSharing ? "Sharing" : "Share Screen"}
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-6 py-3 rounded-full font-semibold shadow-lg transition ${
                isRecording ? "bg-rose-600 animate-pulse" : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              {isRecording ? `⏺ Recording ${formatDuration(recordingDuration)}` : "● Record Session"}
            </button>
          </div>
        </div>
      </div>

      {/* Chat + recordings */}
      <div className="w-full lg:w-[420px] bg-[#090b12] border-l border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-lg font-semibold">Session Chat</h3>
          <p className="text-sm text-white/60 mt-1">Collaborate with your tutor in real time.</p>
        </div>
        <div ref={chatRef} className="flex-1 p-5 space-y-4 overflow-y-auto">
          {chatMessages.map(msg => (
            <div key={msg.id} className="text-sm">
              <div className="text-white/70 font-medium">{msg.sender}</div>
              <div className="mt-1 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-white">
                {msg.message}
              </div>
              <div className="text-white/40 text-[11px] mt-1 uppercase tracking-widest">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {recordings.length > 0 && (
          <div className="border-t border-white/5 bg-black/20 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
              <span>Saved Recordings</span>
              <span>{recordings.length}</span>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {recordings.map(rec => (
                <div key={rec.id} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{rec.filename}</div>
                    <div className="text-xs text-white/50 mt-1">
                      {rec.createdAt.toLocaleString()} • {formatDuration(rec.duration)}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadRecording(rec)}
                    className="ml-4 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold"
                  >
                    ⬇️ Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 border-t border-white/5 bg-black/40">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 rounded-2xl bg-sky-600 hover:bg-sky-500 font-semibold shadow"
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
