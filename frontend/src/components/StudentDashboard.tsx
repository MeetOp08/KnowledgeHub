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
  FaCalendar,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LiveTutoring from "./LiveTutoring";
import LiveVideoChat from "./LiveVideoChat";

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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    grade: "",
    school: "",
    subjects: [] as string[],
    learningGoals: [] as string[],
  });
  const [newSubject, setNewSubject] = useState("");
  const [newLearningGoal, setNewLearningGoal] = useState("");
  const [recordings, setRecordings] = useState<any[]>([]);
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", icon: <FaHome /> },
    { name: "Profile", icon: <FaUser /> },
    { name: "Study Materials", icon: <FaBook /> },
    { name: "Live Tutoring", icon: <FaVideo /> },
    { name: "Live Video Chat", icon: <FaVideo /> },
    { name: "Session Recordings", icon: <FaVideo /> }
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
    
    // Add small delay to allow session to be properly set after login
    const timer = setTimeout(fetchDashboard, 200);
    return () => clearTimeout(timer);
  }, []);

  // ---------- Profile Management ----------
  const openProfileModal = () => {
    setProfileForm({
      fullName: student.fullName,
      email: student.email,
      grade: student.grade || "",
      school: student.school || "",
      subjects: student.subjects || [],
      learningGoals: student.learningGoals || [],
    });
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.fullName || !profileForm.email) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        const updatedStudent = await res.json();
        setDashboard(prev => ({
          ...prev,
          student: { ...prev.student, ...updatedStudent }
        }));
        setShowProfileModal(false);
        alert("Profile updated successfully!");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to update profile");
    }
  };

  const addSubject = () => {
    if (newSubject.trim() && !profileForm.subjects.includes(newSubject.trim())) {
      setProfileForm(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()]
      }));
      setNewSubject("");
    }
  };

  const removeSubject = (subject: string) => {
    setProfileForm(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }));
  };

  const addLearningGoal = () => {
    if (newLearningGoal.trim() && !profileForm.learningGoals.includes(newLearningGoal.trim())) {
      setProfileForm(prev => ({
        ...prev,
        learningGoals: [...prev.learningGoals, newLearningGoal.trim()]
      }));
      setNewLearningGoal("");
    }
  };

  const removeLearningGoal = (goal: string) => {
    setProfileForm(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.filter(g => g !== goal)
    }));
  };

  // Fetch session recordings
  const fetchRecordings = async () => {
    try {
      const res = await fetch("/api/booking/recordings", { credentials: 'include' });
      const data = await res.json();
      setRecordings(data.recordings || []);
    } catch (err) {
      console.error("Error fetching recordings:", err);
    }
  };

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
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
                <p className="text-gray-600">Update your personal information and learning preferences</p>
              </div>
              <button
                onClick={openProfileModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaUser />
                Edit Profile
              </button>
            </div>

            {/* Profile Display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900">{student.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{student.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Grade</label>
                      <p className="text-gray-900">{student.grade || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">School</label>
                      <p className="text-gray-900">{student.school || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Learning Preferences</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Subjects of Interest</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {student.subjects && student.subjects.length > 0 ? (
                          student.subjects.map((subject, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 text-sm rounded">
                              {subject}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No subjects added</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Learning Goals</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {student.learningGoals && student.learningGoals.length > 0 ? (
                          student.learningGoals.map((goal, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-600 text-sm rounded">
                              {goal}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No learning goals set</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePage === "Study Materials" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-2">Study Materials</h2>
              <p className="text-sm opacity-90">Access learning resources from your teachers</p>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl shadow">
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search materials..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Subjects</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.studyMaterials.map((material) => (
                <div key={material._id} className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{material.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                          {material.subject}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded">
                          {material.type?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <span>By: {material.uploadedBy?.fullName || 'Teacher'}</span>
                      <span>Views: {material.views || 0}</span>
                    </div>
                    <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(material.fileUrl, '_blank')}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = material.fileUrl;
                        link.download = material.title;
                        link.click();
                      }}
                      className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
              
              {dashboard.studyMaterials.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <FaBook className="text-4xl text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No materials available</h3>
                  <p className="text-gray-600">Your teachers haven't uploaded any materials yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activePage === "Live Tutoring" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-2">Live Tutoring & Booking</h2>
              <p className="text-sm opacity-90">Book 1:1 sessions with teachers for doubt solving through live video calls</p>
            </div>
            
            <LiveTutoring />
          </div>
        )}

        {activePage === "Live Video Chat" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-2">Live Video Chat</h2>
              <p className="text-sm opacity-90">Connect with your teacher for live doubt solving sessions</p>
            </div>
            
            <LiveVideoChat 
              onEndCall={() => setActivePage("Dashboard")}
              teacherName="Teacher"
              studentName={student.fullName}
            />
          </div>
        )}

        {activePage === "Session Recordings" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-2">Session Recordings</h2>
              <p className="text-sm opacity-90">Watch recordings of your completed tutoring sessions</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Session Recordings</h3>
                <button
                  type="button"
                  onClick={fetchRecordings}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Refresh Recordings
                </button>
              </div>
              
              {recordings.length === 0 ? (
                <div className="text-center py-8">
                  <FaVideo className="text-4xl text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No recordings yet</h3>
                  <p className="text-gray-600">Your completed session recordings will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recordings.map((recording) => (
                    <div key={recording._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {recording.teacherId?.fullName ? recording.teacherId.fullName[0].toUpperCase() : 'T'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {recording.teacherId?.fullName || 'Teacher'}
                          </h4>
                          <p className="text-sm text-gray-500">{recording.subject}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Date:</span> {new Date(recording.completedAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Duration:</span> {Math.floor(recording.recordingDuration / 60)}:{(recording.recordingDuration % 60).toString().padStart(2, '0')}
                        </p>
                        {recording.sessionNotes && (
                          <p className="text-sm text-gray-700 italic">"{recording.sessionNotes}"</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {recording.recordingUrl && (
                          <a
                            href={recording.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 text-center"
                          >
                            🎥 Watch Recording
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Profile</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={profileForm.grade}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 10th, 12th"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School
                  </label>
                  <input
                    type="text"
                    value={profileForm.school}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, school: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your school name"
                  />
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects of Interest
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a subject"
                    onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                  />
                  <button
                    onClick={addSubject}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileForm.subjects.map((subject, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg flex items-center gap-2">
                      {subject}
                      <button
                        onClick={() => removeSubject(subject)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Learning Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Goals
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newLearningGoal}
                    onChange={(e) => setNewLearningGoal(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a learning goal"
                    onKeyPress={(e) => e.key === 'Enter' && addLearningGoal()}
                  />
                  <button
                    onClick={addLearningGoal}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileForm.learningGoals.map((goal, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-600 rounded-lg flex items-center gap-2">
                      {goal}
                      <button
                        onClick={() => removeLearningGoal(goal)}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdateProfile}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
              >
                Update Profile
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
