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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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

  // ---------- Navigation Items ----------
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
        if (data) setDashboard(data);
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

  // ---------- Logout Function ----------
  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
      return;
    }
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      navigate("/login");
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
        <div className="bg-red-100 rounded-full p-4 mb-4">
          <FaBell className="text-red-500 text-2xl" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-red-500 text-lg mb-6">{error}</p>
        <button
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
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
            <h2 className="text-xl font-bold text-purple-600">
              Student Dashboard
            </h2>
          )}
          <button
            className="text-gray-600 hover:text-purple-600"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Profile */}
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1 ${
                  isActive
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                {isSidebarOpen && <span className="truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          className="mt-auto mb-4 mx-4 px-4 py-2 flex items-center gap-2 text-left bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          {isSidebarOpen && <span>Logout</span>}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activePage === "dashboard" && (
          <div className="text-gray-900">
            <h1 className="text-3xl font-bold mb-6">
              Welcome back, {student.fullName}! 🎓
            </h1>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Bookings</p>
                    <p className="text-3xl font-bold text-purple-600">{dashboard.stats.totalBookings}</p>
                  </div>
                  <FaCalendar className="text-4xl text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Confirmed Sessions</p>
                    <p className="text-3xl font-bold text-green-600">{dashboard.stats.confirmedBookings}</p>
                  </div>
                  <FaCheckCircle className="text-4xl text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Study Materials</p>
                    <p className="text-3xl font-bold text-blue-600">{dashboard.stats.totalMaterials}</p>
                  </div>
                  <FaBook className="text-4xl text-blue-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActivePage("study-materials")}
                  className="p-4 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                >
                  <FaBook className="text-2xl text-purple-600 mb-2 mx-auto" />
                  <p className="text-sm font-semibold">Study Materials</p>
                </button>
                
                <button
                  onClick={() => setActivePage("live-tutoring")}
                  className="p-4 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  <FaVideo className="text-2xl text-blue-600 mb-2 mx-auto" />
                  <p className="text-sm font-semibold">Live Tutoring</p>
                </button>
                
                <button
                  onClick={() => setActivePage("recordings")}
                  className="p-4 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                >
                  <FaVideo className="text-2xl text-green-600 mb-2 mx-auto" />
                  <p className="text-sm font-semibold">Recordings</p>
                </button>
                
                <button
                  onClick={() => setActivePage("profile")}
                  className="p-4 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                >
                  <FaUser className="text-2xl text-indigo-600 mb-2 mx-auto" />
                  <p className="text-sm font-semibold">Profile</p>
                </button>
              </div>
            </div>

            {/* Recent Bookings */}
            {dashboard.bookings.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-md mt-6">
                <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
                <div className="space-y-3">
                  {dashboard.bookings.slice(0, 5).map((booking: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-500' :
                          booking.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        <div>
                          <p className="font-semibold">{booking.subject || 'General'}</p>
                          <p className="text-sm text-gray-600">
                            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activePage === "profile" && (
          <div className="text-gray-900">
            <h1 className="text-3xl font-bold mb-6">My Profile</h1>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-2">Full Name</label>
                  <p className="text-gray-900">{student.fullName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-2">Email</label>
                  <p className="text-gray-900">{student.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-2">Grade</label>
                  <p className="text-gray-900">{student.grade || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-2">School</label>
                  <p className="text-gray-900">{student.school || 'Not specified'}</p>
                </div>
                
                {student.subjects && student.subjects.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600 block mb-2">Subjects</label>
                    <div className="flex flex-wrap gap-2">
                      {student.subjects.map((subject, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {student.learningGoals && student.learningGoals.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600 block mb-2">Learning Goals</label>
                    <div className="flex flex-wrap gap-2">
                      {student.learningGoals.map((goal, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activePage === "study-materials" && (
          <div className="text-gray-900">
            <h1 className="text-3xl font-bold mb-6">Study Materials</h1>
            
            {dashboard.studyMaterials && dashboard.studyMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboard.studyMaterials.map((material: any) => (
                  <div key={material._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{material.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                            {material.subject}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded">
                            {material.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <FaEye /> {material.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaDownload /> {material.downloads || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const url = material.fileUrl?.startsWith('http') ? material.fileUrl : `${window.location.origin}${material.fileUrl}`;
                          window.open(url, '_blank');
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <FaEye /> View
                      </button>
                      {material.fileUrl && (
                        <button
                          onClick={() => {
                            const url = material.fileUrl?.startsWith('http') ? material.fileUrl : `${window.location.origin}${material.fileUrl}`;
                            window.open(url, '_blank');
                          }}
                          className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <FaDownload /> Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <FaBook className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Study Materials Yet</h3>
                <p className="text-gray-600">Study materials will appear here when teachers upload them.</p>
              </div>
            )}
          </div>
        )}

        {activePage === "live-tutoring" && <LiveTutoring />}
        
        {activePage === "live-video-chat" && (
          <LiveVideoChat
            onEndCall={() => setActivePage("dashboard")}
            teacherName="Teacher"
            studentName={student.fullName}
          />
        )}
        
        {activePage === "recordings" && (
          <div className="text-gray-900">
            <h1 className="text-3xl font-bold mb-6">Session Recordings</h1>
            
            {dashboard.bookings && dashboard.bookings.filter((b: any) => b.status === 'completed').length > 0 ? (
              <div className="space-y-4">
                {dashboard.bookings
                  .filter((booking: any) => booking.status === 'completed')
                  .map((booking: any) => (
                    <div key={booking._id} className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{booking.subject || 'General Session'}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {booking.recordingUrl ? (
                          <button
                            onClick={() => window.open(booking.recordingUrl, '_blank')}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <FaVideo className="inline mr-2" />
                            Watch Recording
                          </button>
                        ) : (
                          <span className="text-gray-400">No recording available</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <FaVideo className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recordings Yet</h3>
                <p className="text-gray-600">Your completed session recordings will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
