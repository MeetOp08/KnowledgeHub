import { useEffect, useState } from "react";
import { FaBars, FaTimes, FaBook, FaUser, FaClipboardList, FaComments, FaFileAlt, FaSignOutAlt } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

interface TeacherProfile {
  id: string;
  fullName: string;
  email: string;
  subjects?: string[];
  bio?: string;
  experience?: string;
}

interface DashboardData {
  teacher: TeacherProfile;
  bookings: any[];
  studyMaterials: any[];
  stats: {
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    totalEarnings: number;
  };
}

const navItems = [
  { name: "Profile", path: "profile", icon: <FaUser /> },
  { name: "My Classes", path: "classes", icon: <FaBook /> },
  { name: "Study Materials", path: "study-materials", icon: <FaFileAlt /> },
  { name: "Bookings", path: "bookings", icon: <FaClipboardList /> },
  { name: "AI Chat", path: "ai-chat", icon: <FaComments /> },
];

const TeacherDashboard: React.FC = () => {
  const defaultDashboard: DashboardData = {
    teacher: {
      id: "",
      fullName: "Teacher User",
      email: "teacher@example.com",
      subjects: [],
      bio: "",
      experience: "",
    },
    bookings: [],
    studyMaterials: [],
    stats: {
      totalBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      totalEarnings: 0,
    },
  };
  const [dashboard, setDashboard] = useState<DashboardData>(defaultDashboard);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/teacher/dashboard/data", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data) setDashboard(data);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  if (loading) return <div>Loading...</div>;

  const { teacher, stats } = dashboard;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg h-screen flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Header + Toggle */}
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen && (
            <h2 className="text-xl font-bold text-purple-600">Dashboard</h2>
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
              {teacher.fullName[0]}
            </div>
            <h3 className="mt-2 font-semibold">{teacher.fullName}</h3>
            <p className="text-sm text-gray-500">{teacher.email}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 mt-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <button
                key={item.path}
                className={`flex items-center gap-3 px-4 py-2 w-full rounded-md transition-colors ${
                  isActive
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => navigate(`/teacher-dashboard/${item.path}`)}
              >
                {item.icon}
                {isSidebarOpen && <span>{item.name}</span>}
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
      <div className="flex-1 p-6">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-xl shadow-md mb-6">
          <h1 className="text-2xl font-bold">
            Welcome back, {teacher.fullName}! 🎉
          </h1>
          <p className="text-sm opacity-90">
            Here’s your teaching dashboard overview.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold">Total Bookings</h2>
            <p className="text-2xl text-purple-600">{stats.totalBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold">Confirmed</h2>
            <p className="text-2xl text-green-600">{stats.confirmedBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold">Pending</h2>
            <p className="text-2xl text-yellow-600">{stats.pendingBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold">Earnings</h2>
            <p className="text-2xl text-blue-600">₹{stats.totalEarnings}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
