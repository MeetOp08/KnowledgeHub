import React, { useEffect, useState } from "react";
import {
  FaBars,
  FaTimes,
  FaBook,
  FaUser,
  FaClipboardList,
  FaComments,
  FaFileAlt,
  FaSignOutAlt,
  FaPlus,
  FaChartLine,
  FaUsers,
  FaDollarSign,
  FaBell,
  FaHome,
  FaVideo,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LiveVideoChat from "./LiveVideoChat";

// ---------- Interfaces ----------
interface TeacherProfile {
  id: string;
  fullName: string;
  email: string;
  subjects?: string[];
  bio?: string;
  experience?: string;
  qualifications?: string[];
  hourlyRate?: number;
  rating?: number;
  totalSessions?: number;
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
    completedSessions: number;
    averageRating: number;
  };
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();

  // ---------- State ----------
  const [dashboard, setDashboard] = useState<DashboardData>({
    teacher: {
      id: "",
      fullName: "Teacher User",
      email: "teacher@example.com",
      subjects: [],
      bio: "",
      experience: "",
      rating: 0,
      totalSessions: 0,
    },
    bookings: [],
    studyMaterials: [],
    stats: {
      totalBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      totalEarnings: 0,
      completedSessions: 0,
      averageRating: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    subject: "",
    grade: "",
    tags: "",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    bio: "",
    experience: "",
    subjects: [] as string[],
    qualifications: [] as string[],
    hourlyRate: 0,
  });
  const [newSubject, setNewSubject] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [recordings, setRecordings] = useState<any[]>([]);

  // ---------- Navigation Items ----------
  const navItems = [
    { name: "Overview", path: "overview", icon: <FaHome /> },
    { name: "Profile", path: "profile", icon: <FaUser /> },
    { name: "Study Materials", path: "study-materials", icon: <FaFileAlt /> },
    { name: "Bookings", path: "bookings", icon: <FaClipboardList /> },
    { name: "Live Video Chat", path: "live-video-chat", icon: <FaVideo /> },
    { name: "Session Recordings", path: "recordings", icon: <FaVideo /> }
  ];

  // ---------- Quick Actions ----------
  const quickActions: QuickAction[] = [
    {
      title: "Create Material",
      description: "Upload new study material",
      icon: <FaPlus />,
      color: "from-blue-500 to-blue-600",
      action: () => {
        setActiveTab("study-materials");
        setShowUploadModal(true);
      },
    },
    {
      title: "Manage Bookings",
      description: "View and manage all bookings",
      icon: <FaClipboardList />,
      color: "from-green-500 to-green-600",
      action: () => setActiveTab("bookings"),
    }
  ];

  // ---------- Fetch Dashboard Data ----------
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/teacher/dashboard/data", {
          credentials: "include",
        });
        if (res.status === 401) {
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 500);
          return;
        }
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const data = await res.json();
        setDashboard(data);
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

  // ---------- Upload Material ----------
  const BACKEND_BASE = import.meta.env.VITE_API_URL || "";

  const handleUploadMaterial = async () => {
    if (!uploadFile || !uploadForm.title || !uploadForm.subject) {
      alert("Please fill in all required fields and select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadForm.title);
    formData.append("description", uploadForm.description);
    formData.append("subject", uploadForm.subject);
    formData.append("grade", uploadForm.grade);
    formData.append("tags", uploadForm.tags);

    try {
      const res = await fetch("/api/study-materials", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const newMaterial = await res.json();
        setDashboard(prev => ({
          ...prev,
          studyMaterials: [newMaterial, ...prev.studyMaterials]
        }));
        setShowUploadModal(false);
        setUploadForm({ title: "", description: "", subject: "", grade: "", tags: "" });
        setUploadFile(null);
        alert("Material uploaded successfully!");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to upload material");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload material");
    }
  };

  // ---------- Delete Material ----------
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const res = await fetch(`/api/study-materials/${materialId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setDashboard(prev => ({
          ...prev,
          studyMaterials: prev.studyMaterials.filter(m => m._id !== materialId)
        }));
        alert("Material deleted successfully!");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to delete material");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete material");
    }
  };

  // ---------- Profile Management ----------
  const openProfileModal = () => {
    setProfileForm({
      fullName: teacher.fullName,
      email: teacher.email,
      bio: teacher.bio || "",
      experience: teacher.experience || "",
      subjects: teacher.subjects || [],
      qualifications: teacher.qualifications || [],
      hourlyRate: teacher.hourlyRate || 0,
    });
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.fullName || !profileForm.email) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        const updatedTeacher = await res.json();
        setDashboard(prev => ({
          ...prev,
          teacher: { ...prev.teacher, ...updatedTeacher }
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

  const addQualification = () => {
    if (newQualification.trim() && !profileForm.qualifications.includes(newQualification.trim())) {
      setProfileForm(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, newQualification.trim()]
      }));
      setNewQualification("");
    }
  };

  const removeQualification = (qualification: string) => {
    setProfileForm(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter(q => q !== qualification)
    }));
  };

  // ---------- Booking Management Functions ----------
  const handleAcceptBooking = (booking: any) => {
    setSelectedBooking(booking);
    setMeetingLink("");
    setShowAcceptModal(true);
  };

  const acceptBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "";
      const url = `${API_BASE_URL}/api/booking/${selectedBooking._id}/accept`;
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ meetingLink: meetingLink || undefined })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      await res.json();
      alert('Booking accepted successfully! Student has been notified.');
      setShowAcceptModal(false);
      // Refresh dashboard data
      window.location.reload();
    } catch (err: any) {
      console.error('Error accepting booking:', err);
      alert(`Error: ${err.message || 'Unable to reach server. Please check if the backend is running.'}`);
    }
  };

  const handleRejectBooking = (booking: any) => {
    setSelectedBooking(booking);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const rejectBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "";
      const url = `${API_BASE_URL}/api/booking/${selectedBooking._id}/reject`;
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason || undefined })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      await res.json();
      alert('Booking rejected. Student has been notified.');
      setShowRejectModal(false);
      // Refresh dashboard data
      window.location.reload();
    } catch (err: any) {
      console.error('Error rejecting booking:', err);
      alert(`Error: ${err.message || 'Unable to reach server. Please check if the backend is running.'}`);
    }
  };

  const handleCompleteSession = (booking: any) => {
    setSelectedBooking(booking);
    setSessionNotes("");
    setShowCompleteModal(true);
  };

  const completeSession = async () => {
    if (!selectedBooking) return;
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "";
      const url = `${API_BASE_URL}/api/booking/${selectedBooking._id}/complete`;
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionNotes: sessionNotes || undefined })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      await res.json();
      alert('Session completed successfully! Student has been notified.');
      setShowCompleteModal(false);
      // Refresh dashboard data
      window.location.reload();
    } catch (err: any) {
      console.error('Error completing session:', err);
      alert(`Error: ${err.message || 'Unable to reach server. Please check if the backend is running.'}`);
    }
  };

  const generateMeetingLink = () => {
    const meetingId = Math.random().toString(36).substring(2, 15);
    const meetingUrl = `https://meet.google.com/${meetingId}`;
    setMeetingLink(meetingUrl);
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

  // ---------- Logout ----------
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ---------- Loading State ----------
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

  // ---------- Error State ----------
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center bg-gray-50">
        <div className="bg-red-100 rounded-full p-4 mb-4">
          <FaBell className="text-red-500 text-2xl" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
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

  const { teacher, stats } = dashboard;

  // ---------- Render Content Based on Active Tab ----------
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {teacher.fullName}! 👋
                  </h1>
                  <p className="text-lg opacity-90">
                    Here's what's happening with your teaching today.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  <div className="text-sm opacity-75">Total Bookings</div>
                </div>
              </div>
            </div>


            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      action.action();
                    }}
                    className={`p-4 rounded-lg bg-gradient-to-r ${action.color} text-white hover:shadow-lg transition-all transform hover:scale-105`}
                  >
                    <div className="flex items-center space-x-3">
                      {action.icon}
                      <div className="text-left">
                        <div className="font-semibold">{action.title}</div>
                        <div className="text-sm opacity-90">{action.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {dashboard.bookings.slice(0, 5).map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        New booking from {booking.studentName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {dashboard.bookings.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <FaUsers className="text-blue-600 text-3xl mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{stats.completedSessions}</div>
                  <div className="text-sm text-gray-600">Completed Sessions</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <FaChartLine className="text-green-600 text-3xl mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{stats.averageRating.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <FaDollarSign className="text-purple-600 text-3xl mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">₹{stats.totalEarnings}</div>
                  <div className="text-sm text-gray-600">Total Earnings</div>
                </div>
              </div>
            </div>
          </div>
        );

      case "study-materials":
        return (
          <div className="space-y-6">
            {/* Header with Upload Button */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Study Materials</h3>
                <p className="text-gray-600">Manage and upload your teaching materials</p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <FaPlus />
                Upload Material
              </button>
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.studyMaterials.map((material) => (
                <div key={material._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{material.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                          {material.subject}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded">
                          {material.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <span>Views: {material.views}</span>
                      <span>Downloads: {material.downloads}</span>
                    </div>
                    <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const url = material.fileUrl?.startsWith('http') ? material.fileUrl : `${BACKEND_BASE}${material.fileUrl}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(material._id)}
                      className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              
              {dashboard.studyMaterials.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No materials uploaded yet</h3>
                  <p className="text-gray-600">Upload your first study material to get started</p>
                </div>
              )}
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Profile Management</h3>
                <p className="text-gray-600">Update your teaching profile and personal information</p>
              </div>
              <button
                onClick={openProfileModal}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
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
                      <p className="text-gray-900">{teacher.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{teacher.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bio</label>
                      <p className="text-gray-900">{teacher.bio || "No bio provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Experience</label>
                      <p className="text-gray-900">{teacher.experience || "No experience provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hourly Rate</label>
                      <p className="text-gray-900">₹{teacher.hourlyRate || 0}/hour</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Teaching Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Subjects</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {teacher.subjects && teacher.subjects.length > 0 ? (
                          teacher.subjects.map((subject, index) => (
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
                      <label className="text-sm font-medium text-gray-600">Qualifications</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {teacher.qualifications && teacher.qualifications.length > 0 ? (
                          teacher.qualifications.map((qual: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-600 text-sm rounded">
                              {qual}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No qualifications added</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Rating</label>
                      <p className="text-gray-900">{teacher.rating || 0}/5 ⭐</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Sessions</label>
                      <p className="text-gray-900">{teacher.totalSessions || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "bookings":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Booking Management</h3>
              <p className="text-gray-600 mb-6">Manage your teaching bookings and sessions</p>
              
              <div className="space-y-4">
                {dashboard.bookings.map((booking, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {booking.studentId?.fullName ? booking.studentId.fullName[0].toUpperCase() : 'S'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {booking.studentId?.fullName || booking.studentName || 'Student'}
                          </h4>
                          <p className="text-sm text-gray-500">{booking.studentId?.email || ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">₹{booking.amount || booking.price || 0}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Subject:</span> {booking.subject || 'General'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Date:</span> {booking.startTime ? new Date(booking.startTime).toLocaleDateString() : new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Time:</span> {booking.startTime ? new Date(booking.startTime).toLocaleTimeString() : 'TBD'}
                        </p>
                      </div>
                      <div>
                        {booking.message && (
                          <p className="text-sm text-gray-700 italic">
                            <span className="font-medium">Message:</span> "{booking.message}"
                          </p>
                        )}
                        {booking.meetingLink && booking.status === 'confirmed' && (
                          <a
                            href={booking.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Join Session
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action buttons based on status */}
                    <div className="flex gap-3 flex-wrap">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptBooking(booking)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                          >
                            ✓ Accept Booking
                          </button>
                          <button
                            onClick={() => handleRejectBooking(booking)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                          >
                            ✗ Reject Booking
                          </button>
                        </>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => handleCompleteSession(booking)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                          >
                            Complete Session
                          </button>
                          {booking.meetingLink && (
                            <a
                              href={booking.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                            >
                              🎥 Join Session
                            </a>
                          )}
                        </>
                      )}
                      
                      {booking.status === 'completed' && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <span>✓</span>
                          <span>Session Completed</span>
                        </div>
                      )}
                      
                      {booking.status === 'rejected' && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <span>✗</span>
                          <span>Booking Rejected</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {dashboard.bookings.length === 0 && (
                  <div className="text-center py-8">
                    <FaClipboardList className="text-4xl text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                    <p className="text-gray-600">Your booking requests will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "live-video-chat":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-2">Live Video Chat</h2>
              <p className="text-sm opacity-90">Connect with students for live doubt solving sessions</p>
            </div>
            
            <LiveVideoChat 
              onEndCall={() => setActiveTab("overview")}
              teacherName={teacher.fullName}
              studentName="Student"
              meetingLink={dashboard.bookings.find(b => b.status === 'confirmed' && b.meetingLink)?.meetingLink}
            />
          </div>
        );

      case "recordings":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-2">Session Recordings</h2>
              <p className="text-sm opacity-90">View and manage your completed session recordings</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Completed Sessions</h3>
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
                            {recording.studentId?.fullName ? recording.studentId.fullName[0].toUpperCase() : 'S'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {recording.studentId?.fullName || 'Student'}
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
        );

      case "ai-chat":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Assistant</h3>
              <p className="text-gray-600 mb-6">Get help with AI-powered teaching assistance</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <FaComments className="text-2xl text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Lesson Planning</h4>
                  <p className="text-sm text-gray-600">Get AI help with creating lesson plans</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <FaBook className="text-2xl text-green-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Content Creation</h4>
                  <p className="text-sm text-gray-600">Generate educational content and materials</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <FaChartLine className="text-2xl text-purple-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Student Assessment</h4>
                  <p className="text-sm text-gray-600">Create quizzes and assessment tools</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Coming Soon:</strong> Full AI chat interface will be available here. 
                  For now, you can access the main AI chat from the navigation menu.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        );
    }
  };

  // ---------- JSX ----------
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg h-screen flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {isSidebarOpen && (
            <h2 className="text-xl font-bold text-purple-600">Teacher Dashboard</h2>
          )}
          <button
            type="button"
            className="text-gray-600 hover:text-purple-600 transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Profile */}
        {isSidebarOpen && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-200 text-purple-800 rounded-full flex items-center justify-center text-lg font-bold">
              {teacher.fullName ? teacher.fullName[0].toUpperCase() : "T"}
            </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{teacher.fullName}</h3>
                <p className="text-sm text-gray-500 truncate">{teacher.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 mt-4 px-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.path);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1 ${
                activeTab === item.path
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span className="truncate">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
        <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 text-left bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          {isSidebarOpen && <span>Logout</span>}
        </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderContent()}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Study Material</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter material title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Enter material description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Economics">Economics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={uploadForm.grade}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 10th, 12th"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File *
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUploadMaterial}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
              >
                Upload
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Tell students about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience
                </label>
                <textarea
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={2}
                  placeholder="Describe your teaching experience..."
                />
        </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate (₹)
                </label>
                <input
                  type="number"
                  value={profileForm.hourlyRate}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your hourly rate"
                />
          </div>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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

              {/* Qualifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualifications
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Add a qualification"
                    onKeyPress={(e) => e.key === 'Enter' && addQualification()}
                  />
                  <button
                    onClick={addQualification}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileForm.qualifications.map((qualification, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-600 rounded-lg flex items-center gap-2">
                      {qualification}
                      <button
                        onClick={() => removeQualification(qualification)}
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
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
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

      {/* Accept Booking Modal */}
      {showAcceptModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Accept Booking Request</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Student:</strong> {selectedBooking.studentId?.fullName || 'Student'}<br/>
                  <strong>Subject:</strong> {selectedBooking.subject}<br/>
                  <strong>Student Message:</strong> {selectedBooking.message || "No message provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Link (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={generateMeetingLink}
                    className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty if you'll share the link later, or generate a Google Meet link
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={acceptBooking}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
              >
                Accept Booking
              </button>
              <button 
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Booking Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Booking Request</h3>
            <div className="space-y-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Student:</strong> {selectedBooking.studentId?.fullName || 'Student'}<br/>
                  <strong>Subject:</strong> {selectedBooking.subject}<br/>
                  <strong>Student Message:</strong> {selectedBooking.message || "No message provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Not available at this time, Please book for a later slot..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The student will be notified that you're not available and can book later
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={rejectBooking}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
              >
                Reject Booking
              </button>
              <button 
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Session Modal */}
      {showCompleteModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Session</h3>
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Student:</strong> {selectedBooking.studentId?.fullName || 'Student'}<br/>
                  <strong>Subject:</strong> {selectedBooking.subject}<br/>
                  <strong>Session Time:</strong> {selectedBooking.startTime ? new Date(selectedBooking.startTime).toLocaleString() : 'TBD'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Notes (Optional)
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Brief summary of what was covered in the session..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add any important points covered or topics discussed
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={completeSession}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
              >
                Complete Session
              </button>
              <button 
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
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

export default TeacherDashboard;