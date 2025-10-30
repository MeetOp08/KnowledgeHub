import React, { useState, useEffect } from "react";
import {
  FaBook,
  FaUser,
  FaVideo,
  FaBars,
  FaHome,
  FaTimes,
  FaSignOutAlt,
  FaCalendar,
  FaBell,
  FaDownload,
  FaEye,
  FaCheckCircle,
  FaHistory,
  FaPlus,
  FaTrash,
  FaSave,
  FaEdit,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import StudyMaterials from "./StudyMaterials";
import LiveTutoring from "./LiveTutoring";
import LiveVideoChat from "./LiveVideoChat";

// ---------- Interfaces ----------
interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  grade?: string;
  school?: string;
  subjects?: string[];
  learningGoals?: string[];
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

declare global {
  interface Window {
    toast?: { success: (msg: string) => void; error: (msg: string) => void };
  }
}

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
      learningGoals: [],
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
  const [updatedProfile, setUpdatedProfile] = useState<StudentProfile>(dashboard.student);

  // ---------- Navigation ----------
  const navItems = [
    { name: "Dashboard", path: "dashboard", icon: <FaHome /> },
    { name: "Profile", path: "profile", icon: <FaUser /> },
    { name: "Study Materials", path: "study-materials", icon: <FaBook /> },
    { name: "Live Tutoring", path: "live-tutoring", icon: <FaVideo /> },
    { name: "Live Video Chat", path: "live-video-chat", icon: <FaVideo /> },
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
          setUpdatedProfile(data.student);
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
  const handleProfileChange = (field: keyof StudentProfile, value: any) => {
    setUpdatedProfile({ ...updatedProfile, [field]: value });
  };

  const handleAddItem = (field: "subjects" | "learningGoals", value: string) => {
    if (!value.trim()) return;
    setUpdatedProfile({
      ...updatedProfile,
      [field]: [...(updatedProfile[field] || []), value.trim()],
    });
  };

  const handleRemoveItem = (field: "subjects" | "learningGoals", index: number) => {
    const updated = [...(updatedProfile[field] || [])];
    updated.splice(index, 1);
    setUpdatedProfile({ ...updatedProfile, [field]: updated });
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch("/api/student/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedProfile),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const data = await res.json();
      setDashboard((prev) => ({ ...prev, student: data.student }));
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("Failed to update profile. Please try again.");
    }
  };

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
          <div className="mx-auto max-w-xl">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1">My Profile</h1>
                  <p className="text-gray-500 text-sm">Your basic info—keep it up to date!</p>
                </div>
                <button
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mt-3 md:mt-0 disabled:opacity-50"
                  onClick={() => setEditMode(true)}
                  disabled={loading}
                >
                  <FaEdit /> Edit Profile
                </button>
              </div>
              {/* Profile detail grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-500 mb-1">Full Name</label>
                  <div className="font-medium text-lg">{student.fullName}</div>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Email</label>
                  <div className="text-gray-600">{student.email}</div>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Grade</label>
                  <div>{student.grade || <span className="text-gray-400">Not set</span>}</div>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">School</label>
                  <div>{student.school || <span className="text-gray-400">Not set</span>}</div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-500 mb-1">Subjects</label>
                  {student.subjects && student.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {student.subjects.map((subject, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {subject}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">No subjects</span>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-500 mb-1">Learning Goals</label>
                  {student.learningGoals && student.learningGoals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {student.learningGoals.map((goal, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {goal}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">No goals set</span>
                  )}
                </div>
              </div>
            </div>
            {/* Edit Modal */}
            {editMode && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
                <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-lg relative">
                  <h2 className="text-xl font-bold mb-4">Edit My Profile</h2>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      // Validate required fields
                      if (!updatedProfile.fullName.trim()) {
                        setError("Name is required.");
                        return;
                      }
                      setLoading(true);
                      setError(null);
                      try {
                        const res = await fetch("/api/student/profile/update", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify(updatedProfile),
                        });
                        if (!res.ok) {
                          let msg = "Failed to update profile.";
                          try {
                            const err = await res.json();
                            if (err?.error || err?.message) msg = err.error || err.message;
                          } catch {}
                          setError(msg);
                          if (window?.toast) window.toast.error(msg);
                          return;
                        }
                        const data = await res.json();
                        setDashboard((prev) => ({ ...prev, student: data.student }));
                        setEditMode(false);
                        if (window?.toast) window.toast.success("Profile updated!");
                        else alert("Profile updated!");
                      } catch (err) {
                        setError("Profile update failed. Network/server error.");
                        if (window?.toast) window.toast.error("Profile update failed. Network/server error.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-500 mb-1">Full Name *</label>
                        <input
                          type="text"
                          className="w-full border rounded p-2"
                          value={updatedProfile.fullName}
                          onChange={e => handleProfileChange("fullName", e.target.value)}
                          required
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Email</label>
                        <input type="email" className="w-full border rounded p-2 bg-gray-100" value={updatedProfile.email} disabled />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-gray-500 mb-1">Grade</label>
                          <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={updatedProfile.grade || ""}
                            onChange={e => handleProfileChange("grade", e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-gray-500 mb-1">School</label>
                          <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={updatedProfile.school || ""}
                            onChange={e => handleProfileChange("school", e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Subjects</label>
                        {/* Chip editor for subjects */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {updatedProfile.subjects?.map((s, i) => (
                            <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                              {s}
                              <button type="button" className="ml-1 text-xs" onClick={() => handleRemoveItem("subjects", i)}>&times;</button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          className="w-full border rounded p-2"
                          placeholder="Add subject and press Enter"
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              handleAddItem("subjects", e.currentTarget.value);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Learning Goals</label>
                        {/* Chip editor for goals */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {updatedProfile.learningGoals?.map((g, i) => (
                            <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                              {g}
                              <button type="button" className="ml-1 text-xs" onClick={() => handleRemoveItem("learningGoals", i)}>&times;</button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          className="w-full border rounded p-2"
                          placeholder="Add goal and press Enter"
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              handleAddItem("learningGoals", e.currentTarget.value);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                      </div>
                    </div>
                    {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
                    <div className="flex gap-4 mt-8">
                      <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 focus:outline-none disabled:opacity-70" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300" onClick={() => setEditMode(false)} disabled={loading}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keep other sections (study-materials, tutoring, etc.) unchanged */}
        {activePage === "study-materials" && <StudyMaterials />}
        {activePage === "live-tutoring" && <LiveTutoring />}
        {activePage === "live-video-chat" && (
          <LiveVideoChat
            onEndCall={() => setActivePage("dashboard")}
            teacherName="Teacher"
            studentName={student.fullName}
          />
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
