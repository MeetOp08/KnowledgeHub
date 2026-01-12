import React, { useState, useEffect } from "react";
import {
  FaBook,
  FaUser,
  FaVideo,
  FaBars,
  FaHome,
  FaTimes,
  FaSignOutAlt,
  FaCommentDots,
  FaBell,
  FaHistory,
  FaEdit,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import StudyMaterials from "./StudyMaterials";
import AIChat from "./AIChat";
import LiveTutoring from "./LiveTutoring";
import LiveVideoChat, { LiveSessionRecording } from "./LiveVideoChat";

// ---------- Interfaces ----------
interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  birthdate?: string;
  grade?: string;
  school?: string;  
  subjects?: string[];
  avatarUrl?: string;
  address?: string;
  timezone?: string;
  learningGoals?: string[];
  preferredLearningStyle?: string;
}

interface DashboardData {
  student: StudentProfile;
  bookings: any[];
  studyMaterials: any[];
  stats: {
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalMaterials: number;
  };
}

// ✅ Added props interface
interface StudentDashboardProps {
  onLogout?: () => Promise<void>;
}

interface SessionRecording extends LiveSessionRecording {}

declare global {
  interface Window {
    toast?: { success: (msg: string) => void; error: (msg: string) => void };
  }
}

const RECORDINGS_STORAGE_KEY = "khub-session-recordings-v1";

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  // ---------- State ----------
  const [dashboard, setDashboard] = useState<DashboardData>({
    student: {
      id: "",
      fullName: "Student User",
      email: "student@example.com",
      grade: "10",
      school: "",
      subjects: [],
    },
    bookings: [],
    studyMaterials: [],
    stats: {
      totalBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      completedBookings: 0,
      totalMaterials: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState<StudentProfile | null>(null);
  const [subjectsInput, setSubjectsInput] = useState("");
  const [learningGoalsInput, setLearningGoalsInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTeacherName, setRatingTeacherName] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [sessionRecordings, setSessionRecordings] = useState<SessionRecording[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(RECORDINGS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("Failed to load recordings from storage:", err);
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(RECORDINGS_STORAGE_KEY);
      if (raw) {
        setSessionRecordings(current => (current.length ? current : JSON.parse(raw)));
      }
    } catch (err) {
      console.error("Failed to hydrate recordings:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(sessionRecordings));
    } catch (err) {
      console.error("Failed to persist recordings:", err);
    }
  }, [sessionRecordings]);

  const handleRecordingSaved = (recording: LiveSessionRecording) => {
    setSessionRecordings(prev => [recording, ...prev]);
    window.toast?.success?.("Session recording saved to your dashboard.") ?? console.info("Recording saved");
  };

  const downloadStoredRecording = (recording: SessionRecording) => {
    const link = document.createElement("a");
    link.href = recording.dataUrl;
    link.download = recording.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRecordingDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndLiveCall = (bookingId?: string, teacherNameOverride?: string) => {
    setRatingTeacherName(teacherNameOverride || "Teacher");
    setRatingValue(0);
    setRatingComment("");
    setRatingBookingId(bookingId || null);
    setShowRatingModal(true);
    setActivePage("dashboard");
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingValue) {
      window.toast?.error?.("Please select a rating.") ?? alert("Please select a rating.");
      return;
    }
    try {
      setRatingSubmitting(true);
      if (ratingBookingId) {
        await fetch(`/api/booking/${ratingBookingId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ rating: ratingValue, feedback: ratingComment }),
        });
      } else {
        // Fallback: no booking context yet, just simulate
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      window.toast?.success?.("Thank you for rating your teacher!") ?? alert("Thank you for your rating!");
      setShowRatingModal(false);
    } catch (err) {
      console.error("Rating submit failed:", err);
      window.toast?.error?.("Failed to submit rating.") ?? alert("Failed to submit rating.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  // ---------- Navigation ----------
  const navItems = [
    { name: "Dashboard", path: "dashboard", icon: <FaHome /> },
    { name: "Profile", path: "profile", icon: <FaUser /> },
    { name: "Study Materials", path: "study-materials", icon: <FaBook /> },
    { name: "AI Chat", path: "ai-chat", icon: <FaCommentDots /> },
    { name: "Live Tutoring", path: "live-tutoring", icon: <FaVideo /> },
    // { name: "Live Video Chat", path: "live-video-chat", icon: <FaVideo /> },
    { name: "Session Recordings", path: "recordings", icon: <FaVideo /> },
  ];

  // ---------- Fetch Dashboard Data ----------
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setError(null);
        const res = await fetch("/api/student/dashboard/data", {
          credentials: "include",
        });

        if (res.status === 401) {
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 500);
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to load dashboard data: ${res.status}`);
        }

        const data = await res.json();
        if (data) {
          setDashboard(data);
        }
      } catch (err: any) {
        console.error("Error fetching dashboard:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchDashboard, 200);
    return () => clearTimeout(timer);
  }, [navigate]);

  // ---------- Logout ----------
  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
      return;
    }
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      navigate("/login");
    }
  };

  // ---------- Profile Editing ----------
  // REMOVE handleProfileChange, handleAddItem, handleRemoveItem, handleSaveProfile if unused in the current UI/forms.

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center bg-gray-50">
        <FaBell className="text-red-500 text-3xl mb-3" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const { student } = dashboard;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg h-screen flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen && (
            <h2 className="text-xl font-bold text-purple-600">Student Dashboard</h2>
          )}
          <button
            className="text-gray-600 hover:text-purple-600"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Profile Summary */}
        {isSidebarOpen && (
          <div className="p-4 border-b text-center">
            <div className="w-16 h-16 mx-auto bg-purple-200 text-purple-800 rounded-full flex items-center justify-center text-2xl font-bold">
              {student.fullName[0]}
            </div>
            <h3 className="mt-2 font-semibold">{student.fullName}</h3>
            <p className="text-sm text-gray-500">{student.email}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 mt-4 px-2">
          {navItems.map((item) => {
            const isActive = activePage === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => setActivePage(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                {isSidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          className="mt-auto mb-4 mx-4 px-4 py-2 flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          {isSidebarOpen && <span>Logout</span>}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* --- Dashboard Page --- */}
        {activePage === "dashboard" && (
          <div>
            <h1 className="text-3xl font-bold mb-6">
              Welcome back, {student.fullName}! 🎓
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <p className="text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-purple-600">
                  {dashboard.stats.totalBookings}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <p className="text-gray-600">Confirmed</p>
                <p className="text-3xl font-bold text-green-600">
                  {dashboard.stats.confirmedBookings}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <p className="text-gray-600">Study Materials</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dashboard.stats.totalMaterials}
                </p>
              </div>
            </div>

            {/* --- Student History --- */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center mb-4 gap-2">
                <FaHistory className="text-purple-600" />
                <h2 className="text-xl font-bold">Student History</h2>
              </div>
              {dashboard.bookings.filter((b) => b.status === "completed").length > 0 ? (
                <div className="space-y-3">
                  {dashboard.bookings
                    .filter((b) => b.status === "completed")
                    .slice(0, 5)
                    .map((b) => (
                      <div
                        key={b._id}
                        className="flex justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <p className="font-semibold">{b.subject || "Session"}</p>
                        <span className="text-sm text-gray-500">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No history yet.</p>
              )}
            </div>
          </div>
        )}

        {/* --- Editable Profile --- */}
        {activePage === "profile" && (
          <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-8 mt-6 flex flex-col gap-8">
            {!editMode ? (
              <>
                <div className="flex md:flex-row flex-col gap-7 items-start md:items-center">
                  <div>
                    {student.avatarUrl ? (
                      <img src={student.avatarUrl} alt="Avatar" className="w-28 h-28 rounded-full object-cover border" />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-purple-100 flex items-center justify-center text-4xl text-purple-500 font-bold">
                        {student.fullName[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-800">{student.fullName}</h2>
                    <p className="text-gray-500 text-sm mt-1 mb-3">{student.email}</p>
                    {!!student.grade && <p className="text-gray-600 mb-1"><span className="font-medium">Grade:</span> {student.grade}</p>}
                    {!!student.school && <p className="text-gray-600 mb-1"><span className="font-medium">School:</span> {student.school}</p>}
                    {!!student.phone && <p className="text-gray-600 mb-1"><span className="font-medium">Phone:</span> {student.phone}</p>}
                    {!!student.gender && <p className="text-gray-600 mb-1"><span className="font-medium">Gender:</span> {student.gender}</p>}
                    {!!student.birthdate && <p className="text-gray-600 mb-1"><span className="font-medium">Birthdate:</span> {student.birthdate}</p>}
                    {!!student.address && <p className="text-gray-600 mb-1"><span className="font-medium">Address:</span> {student.address}</p>}
                    {!!student.timezone && <p className="text-gray-600 mb-1"><span className="font-medium">Timezone:</span> {student.timezone}</p>}
                    <button onClick={() => { setEditProfile(dashboard.student); setSubjectsInput(""); setLearningGoalsInput(""); setEditMode(true); }} className="mt-4 px-5 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"><FaEdit className="inline mr-2"/>Edit Profile</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-gray-800">Learning Goals</h4>
                    <div className="flex flex-wrap gap-2">
                    {student.learningGoals?.length ? student.learningGoals.map((goal, idx) => (
                      <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm">{goal}</span>
                    )) : <span className="text-gray-500">N/A</span>}
                    </div>
                    <h4 className="font-semibold text-lg mt-6 mb-2 text-gray-800">Preferred Learning Style</h4>
                    <p className="text-gray-700 min-h-[24px]">{student.preferredLearningStyle || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-gray-800">Subjects</h4>
                    <div className="flex flex-wrap gap-2">
                      {student.subjects?.length ? student.subjects.map((sub, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">{sub}</span>
                      )) : <span className="text-gray-500">N/A</span>}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <form
                className="space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFormError(null);
                  if (!editProfile?.fullName || !editProfile.email) {
                    setFormError("Full name and email are required.");
                    return;
                  }
                  try {
                    const res = await fetch("/api/student/profile/update", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify(editProfile),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => null);
                      setFormError(err?.error || err?.message || "Profile update failed.");
                      return;
                    }
                    const data = await res.json();
                    setDashboard((prev) => ({ ...prev, student: data.student }));
                    setEditMode(false);
                    window.toast?.success?.("Profile updated!") || alert("Profile updated!");
                  } catch {
                    setFormError("Network/server error.");
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Avatar/Photo Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-500 mb-1">Profile Photo (URL)</label>
                      <input
                        type="text"
                        value={editProfile?.avatarUrl || ""}
                        onChange={e => setEditProfile(p => p ? { ...p, avatarUrl: e.target.value } : p)}
                        className="w-full border rounded p-2"
                        placeholder="Paste image URL here"
                      />
                      {editProfile?.avatarUrl && (
                        <img src={editProfile.avatarUrl} alt="avatar" className="mt-2 w-16 h-16 rounded-full border" />
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={editProfile?.fullName || ""}
                        onChange={e => setEditProfile(p => p ? { ...p, fullName: e.target.value } : p)}
                        className="w-full border rounded p-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={editProfile?.email || ""}
                        disabled
                        className="w-full border rounded p-2 bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Phone</label>
                      <input
                        type="text"
                        value={editProfile?.phone || ""}
                        onChange={e => setEditProfile(p => p ? { ...p, phone: e.target.value } : p)}
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-gray-500 mb-1">Gender</label>
                        <select className="w-full border rounded p-2" value={editProfile?.gender || ""} onChange={e => setEditProfile(p => p ? { ...p, gender: e.target.value } : p)}>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-gray-500 mb-1">Birthdate</label>
                        <input
                          type="date"
                          value={editProfile?.birthdate?.slice(0, 10) || ""}
                          onChange={e => setEditProfile(p => p ? { ...p, birthdate: e.target.value } : p)}
                          className="w-full border rounded p-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Address</label>
                      <input
                        type="text"
                        value={editProfile?.address || ""}
                        onChange={e => setEditProfile(p => p ? { ...p, address: e.target.value } : p)}
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Timezone</label>
                      <input
                        type="text"
                        value={editProfile?.timezone || ""}
                        onChange={e => setEditProfile(p => p ? { ...p, timezone: e.target.value } : p)}
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                  {/* Second column: arrays, grade/school, goals */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-500 mb-1">Grade</label>
                      <input
                        type="text"
                        value={editProfile?.grade || ""}
                        onChange={e => setEditProfile(p => p ? { ...p, grade: e.target.value } : p)}
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">School</label>
                      <input
                        type="text"
                        value={editProfile?.school || ""}
                        onChange={e => setEditProfile(p => p ? { ...p, school: e.target.value } : p)}
                        className="w-full border rounded p-2"
                      />
                    </div>
                    {/* Subjects (array) */}
                    <div>
                      <label className="block text-gray-500 mb-1">Subjects</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editProfile?.subjects?.map((subject, idx) => (
                          <span key={idx} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm ">{subject} <button type="button" className="ml-1 text-xs" onClick={() => setEditProfile(p => p ? { ...p, subjects: (p.subjects || []).filter((_, i) => i !== idx) } : p)}>&times;</button></span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={subjectsInput}
                        onChange={e => setSubjectsInput(e.target.value)}
                        className="w-full border rounded p-2 mb-2"
                        placeholder="Add subject and press Enter"
                        onKeyDown={e => {
                          if (e.key === "Enter" && editProfile && subjectsInput.trim()) {
                            e.preventDefault();
                            setEditProfile(p => p ? {
                              ...p,
                              subjects: [...(p.subjects || []), subjectsInput.trim()],
                            } : p);
                            setSubjectsInput("");
                          }
                        }}
                      />
                    </div>
                    {/* Learning Goals (array) */}
                    <div>
                      <label className="block text-gray-500 mb-1">Learning Goals</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editProfile?.learningGoals?.map((goal, idx) => (
                          <span key={idx} className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm ">{goal} <button type="button" className="ml-1 text-xs" onClick={() => setEditProfile(p => p ? { ...p, learningGoals: (p.learningGoals || []).filter((_, i) => i !== idx) } : p)}>&times;</button></span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={learningGoalsInput}
                        onChange={e => setLearningGoalsInput(e.target.value)}
                        className="w-full border rounded p-2 mb-2"
                        placeholder="Add goal and press Enter"
                        onKeyDown={e => {
                          if (e.key === "Enter" && editProfile && learningGoalsInput.trim()) {
                            e.preventDefault();
                            setEditProfile(p => p ? {
                              ...p,
                              learningGoals: [...(p.learningGoals || []), learningGoalsInput.trim()],
                            } : p);
                            setLearningGoalsInput("");
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Preferred Learning Style</label>
                      <input
                        type="text"
                        value={editProfile?.preferredLearningStyle || ""}
                        onChange={e => setEditProfile(p => p ? { ...p, preferredLearningStyle: e.target.value } : p)}
                        className="w-full border rounded p-2"
                        placeholder="e.g., Visual, Auditory, ..."
                      />
                    </div>
                  </div>
                </div>
                {formError && <div className="text-red-600 text-sm mt-3">{formError}</div>}
                <div className="flex gap-4 mt-8 sticky bottom-0 bg-white py-4 z-10">
                  <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-70">Save Changes</button>
                  <button type="button" className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300" onClick={() => { setEditMode(false); setFormError(null); setEditProfile(null); }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Keep other sections (study-materials, tutoring, etc.) unchanged */}
        {activePage === "study-materials" && <StudyMaterials />}
        {activePage === "ai-chat" && <AIChat />}
        {activePage === "live-tutoring" && <LiveTutoring />}
        {activePage === "live-video-chat" && (
          <LiveVideoChat
            onEndCall={handleEndLiveCall}
            teacherName="Teacher"
            studentName={student.fullName}
            onRecordingReady={handleRecordingSaved}
          />  
        )}
        {activePage === "recordings" && (
          <div className="mt-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Session Recordings</h1>
              <p className="text-gray-600">
                Every time you finish a live video session, the recording is saved here for future review.
              </p>
            </div>
            {sessionRecordings.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow">
                <p className="text-gray-500">No recordings yet. Join a live session to automatically save it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sessionRecordings.map((rec) => (
                  <div key={rec.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden flex flex-col">
                    <video controls src={rec.dataUrl} className="w-full h-56 object-cover bg-black" />
                    <div className="p-4 flex flex-col gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">{rec.filename}</p>
                        <p className="text-sm text-gray-500">
                          Saved on {new Date(rec.createdAt).toLocaleString()} • {formatRecordingDuration(rec.duration)}
                        </p>
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button
                          className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                          onClick={() => downloadStoredRecording(rec)}
                        >
                          Download
                        </button>
                        <a
                          href={rec.dataUrl}
                          download={rec.filename}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-center hover:bg-gray-50 transition"
                        >
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {showRatingModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-900">
              Rate your session{ratingTeacherName ? ` with ${ratingTeacherName}` : ""}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              How was your experience? Your feedback helps improve future sessions.
            </p>
            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-800 mb-1">Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition ${
                        ratingValue >= star
                          ? "bg-yellow-400 border-yellow-500 text-white"
                          : "bg-white border-gray-300 text-gray-400 hover:bg-yellow-100"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Comments (optional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Share what worked well or what could be improved..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                  onClick={() => setShowRatingModal(false)}
                  disabled={ratingSubmitting}
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-60"
                  disabled={ratingSubmitting}
                >
                  {ratingSubmitting ? "Submitting..." : "Submit Rating"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
