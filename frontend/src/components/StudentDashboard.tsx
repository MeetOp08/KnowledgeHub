import React, { useState } from "react";
import { useEffect } from "react";

import {
  FaBook,
  FaUser,
  FaComments,
  FaVideo,
  FaBars,
  FaHome,
  FaTimes,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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

const StudentDashboard: React.FC = () => {
  const defaultDashboard: DashboardData = {
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
  };
  const [dashboard, setDashboard] = useState<DashboardData>(defaultDashboard);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", icon: <FaHome /> },
    { name: "Profile", icon: <FaUser /> },
    { name: "Study Materials", icon: <FaBook /> },
    { name: "Tutor Booking", icon: <FaVideo /> },
    { name: "Chats", icon: <FaComments /> },
  ];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/student/dashboard/data", {
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

  const { student, stats } = dashboard;

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
            <h2 className="text-xl font-bold text-purple-600">Student Dashboard</h2>
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
        <nav className="flex-1 mt-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activePage === item.name;
            return (
              <button
                key={item.name}
                className={`flex items-center gap-3 px-4 py-2 w-full rounded-md transition-colors ${
                  isActive
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setActivePage(item.name)}
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
        {activePage === "Dashboard" && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-xl shadow-md mb-6">
            <h1 className="text-2xl font-bold">
              Welcome back, {student.fullName}! 🎓
            </h1>
            <p className="text-sm opacity-90">
              Here's your student dashboard overview.
            </p>
          </div>
        )}

        {/* Stats Section */}
        {activePage === "Dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold">Study Materials</h2>
              <p className="text-2xl text-purple-600">{stats.totalMaterials}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold">Total Bookings</h2>
              <p className="text-2xl text-green-600">{stats.totalBookings}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold">Confirmed</h2>
              <p className="text-2xl text-yellow-600">{stats.confirmedBookings}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold">Completed</h2>
              <p className="text-2xl text-blue-600">{stats.completedBookings}</p>
            </div>
          </div>
        )}

        {activePage === "Profile" && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">Profile</h2>
            <p><strong>Name:</strong> {student.fullName}</p>
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Grade:</strong> {student.grade || "Not specified"}</p>
            {student.school && <p><strong>School:</strong> {student.school}</p>}
            {student.subjects && student.subjects.length > 0 && (
              <p><strong>Subjects:</strong> {student.subjects.join(", ")}</p>
            )}
          </div>
        )}

        {activePage === "Study Materials" && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">Study Materials</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Algebra Basics - Ms. Patel</li>
              <li>Newton's Laws - Mr. Singh</li>
              <li>Organic Chemistry - Dr. Rao</li>
            </ul>
          </div>
        )}

        {activePage === "Tutor Booking" && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">Tutor Booking</h2>
            <p>Book a 1:1 session to solve doubts with real-time video calling.</p>
            <button className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
              Book a Session
            </button>
          </div>
        )}

        {activePage === "Chats" && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">Chat History</h2>
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Ms. Patel</span>
                  <span>Yesterday</span>
                </div>
                <p className="mt-1">Please revise chapter 3 examples.</p>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mr. Singh</span>
                  <span>2 days ago</span>
                </div>
                <p className="mt-1">We will discuss your test doubts at 6 PM.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
