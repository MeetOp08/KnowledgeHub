import React, { useEffect, useState } from "react";
import {
  FaBars,
  FaTimes,
  FaBook,
  FaUser,
  FaClipboardList,
  FaSignOutAlt,
  FaPlus,
  FaChartLine,
  FaUsers,
  FaDollarSign,
  FaBell,
  FaHome,
  FaVideo,
  FaFileAlt,
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

interface TeacherDashboardProps {
  onLogout: () => void;
}

declare global {
  interface Window {
    toast?: { success: (msg: string) => void; error: (msg: string) => void };
  }
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout }) => {
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
        setError(null);
        console.log("📡 Fetching teacher dashboard data...");
        const res = await fetch("/api/teacher/dashboard/data", {
          credentials: "include",
        });
        
        console.log("📥 Response status:", res.status);
        
        if (res.status === 401) {
          console.error("❌ Not authenticated, redirecting to login");
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 500);
          return;
        }
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ Failed to load dashboard:", errorText);
          throw new Error(`Failed to load dashboard data: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("✅ Dashboard data received:", data);
        
        if (data) {
          setDashboard(data);
        }
      } catch (err: any) {
        console.error("❌ Error fetching dashboard:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(fetchDashboard, 200);
    return () => clearTimeout(timer);
  }, [navigate]);

  // ---------- Upload Material ----------
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
      console.log("📤 Uploading material:", uploadForm.title);
      const res = await fetch("/api/study-materials", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const newMaterial = await res.json();
        console.log("✅ Material uploaded successfully:", newMaterial);
        setDashboard(prev => ({
          ...prev,
          studyMaterials: [newMaterial, ...prev.studyMaterials]
        }));
        setShowUploadModal(false);
        setUploadForm({ title: "", description: "", subject: "", grade: "", tags: "" });
        setUploadFile(null);
        alert("Material uploaded successfully!");
      } else {
        const error = await res.json().catch(() => ({ message: "Upload failed" }));
        console.error("❌ Upload failed:", error);
        alert(error.message || "Failed to upload material");
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Failed to upload material. Please check your connection and try again.");
    }
  };

  // ---------- Delete Material ----------
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      console.log("🗑️ Deleting material:", materialId);
      const res = await fetch(`/api/study-materials/${materialId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        console.log("✅ Material deleted successfully");
        setDashboard(prev => ({
          ...prev,
          studyMaterials: prev.studyMaterials.filter(m => m._id !== materialId)
        }));
        alert("Material deleted successfully!");
      } else {
        const error = await res.json().catch(() => ({ message: "Delete failed" }));
        console.error("❌ Delete failed:", error);
        alert(error.message || "Failed to delete material");
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("Failed to delete material. Please check your connection and try again.");
    }
  };

  // ---------- Profile Management ----------
  const openProfileModal = () => {
    setProfileForm({
      fullName: dashboard.teacher.fullName,
      email: dashboard.teacher.email,
      bio: dashboard.teacher.bio || "",
      experience: dashboard.teacher.experience || "",
      subjects: dashboard.teacher.subjects || [],
      qualifications: dashboard.teacher.qualifications || [],
      hourlyRate: dashboard.teacher.hourlyRate || 0,
    });
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.fullName || !profileForm.email) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      console.log("📝 Updating profile...");
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        const updatedTeacher = await res.json();
        console.log("✅ Profile updated:", updatedTeacher);
        setDashboard(prev => ({
          ...prev,
          teacher: { ...prev.teacher, ...updatedTeacher }
        }));
        setShowProfileModal(false);
        alert("Profile updated successfully!");
      } else {
        const error = await res.json().catch(() => ({ message: "Update failed" }));
        console.error("❌ Profile update failed:", error);
        alert(error.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("❌ Profile update error:", err);
      alert("Failed to update profile. Please check your connection and try again.");
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
      console.log("✅ Accepting booking:", selectedBooking._id);
      const res = await fetch(`/api/booking/${selectedBooking._id}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ meetingLink: meetingLink || undefined })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("✅ Booking accepted:", data);
      alert('Booking accepted successfully!');
      setShowAcceptModal(false);
      setSelectedBooking(null);
      setMeetingLink("");
      window.location.reload();
    } catch (err: any) {
      console.error('❌ Error accepting booking:', err);
      alert(`Error: ${err.message || 'Unable to reach server.'}`);
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
      console.log("❌ Rejecting booking:", selectedBooking._id);
      const res = await fetch(`/api/booking/${selectedBooking._id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason || undefined })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("✅ Booking rejected:", data);
      alert('Booking rejected.');
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectReason("");
      window.location.reload();
    } catch (err: any) {
      console.error('❌ Error rejecting booking:', err);
      alert(`Error: ${err.message || 'Unable to reach server.'}`);
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
      console.log("✅ Completing session:", selectedBooking._id);
      const res = await fetch(`/api/booking/${selectedBooking._id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionNotes: sessionNotes || undefined })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("✅ Session completed:", data);
      alert('Session completed successfully!');
      setShowCompleteModal(false);
      setSelectedBooking(null);
      setSessionNotes("");
      window.location.reload();
    } catch (err: any) {
      console.error('❌ Error completing session:', err);
      alert(`Error: ${err.message || 'Unable to reach server.'}`);
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
      console.log("📼 Fetching recordings...");
      const res = await fetch("/api/booking/recordings", { credentials: 'include' });
      const data = await res.json();
      console.log("✅ Recordings fetched:", data);
      setRecordings(data.recordings || []);
    } catch (err) {
      console.error("❌ Error fetching recordings:", err);
    }
  };

  // ---------- Logout ----------
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
      console.error("❌ Logout failed:", err);
      navigate("/login");
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Pending Bookings</h3>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
                  </div>
                  <FaClipboardList className="text-2xl text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Completed Sessions</h3>
                    <p className="text-2xl font-bold text-green-600">{stats.completedSessions}</p>
                  </div>
                  <FaUsers className="text-2xl text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Average Rating</h3>
                    <p className="text-2xl font-bold text-blue-600">{stats.averageRating.toFixed(1)} ⭐</p>
                  </div>
                  <FaChartLine className="text-2xl text-blue-500" />
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
              <div className="space-y-3">
                {dashboard.bookings.slice(0, 5).map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-500' :
                        booking.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">
                        {booking.studentId?.fullName || 'Student'} - {booking.subject}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {dashboard.bookings.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No bookings yet</p>
                )}
              </div>
            </div>
          </div>
        );

      case "study-materials":
        return (
          <div className="space-y-6">
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
                        const url = material.fileUrl?.startsWith('http') ? material.fileUrl : `${window.location.origin}${material.fileUrl}`;
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
                          teacher.qualifications.map((qual, index) => (
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
                            {booking.studentId?.fullName || 'Student'}
                          </h4>
                          <p className="text-sm text-gray-500">{booking.studentId?.email || ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
                        </span>
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
                      </div>
                      <div>
                        {booking.message && (
                          <p className="text-sm text-gray-700 italic">
                            <span className="font-medium">Message:</span> "{booking.message}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptBooking(booking)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => handleRejectBooking(booking)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCompleteSession(booking)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Complete Session
                        </button>
                      )}
                      
                      {booking.status === 'completed' && (
                        <span className="text-green-600">✓ Session Completed</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {dashboard.bookings.length === 0 && (
                  <div className="text-center py-8">
                    <FaClipboardList className="text-4xl text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
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
              <p className="text-sm opacity-90">Connect with students for live sessions</p>
            </div>
            
            <LiveVideoChat 
              onEndCall={() => setActiveTab("overview")}
              teacherName={teacher.fullName}
              studentName="Student"
            />
          </div>
        );

      case "recordings":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-2">Session Recordings</h2>
              <p className="text-sm opacity-90">View your completed session recordings</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recordings</h3>
                <button
                  onClick={fetchRecordings}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Refresh
                </button>
              </div>
              
              {recordings.length === 0 ? (
                <div className="text-center py-8">
                  <FaVideo className="text-4xl text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No recordings yet</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recordings.map((recording) => (
                    <div key={recording._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {recording.studentId?.fullName ? recording.studentId.fullName[0] : 'S'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{recording.studentId?.fullName || 'Student'}</h4>
                          <p className="text-sm text-gray-500">{recording.subject}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          Date: {new Date(recording.completedAt).toLocaleDateString()}
                        </p>
                        {recording.recordingUrl && (
                          <a
                            href={recording.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 text-center"
                          >
                            🎥 Watch
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
      <div className={`bg-white shadow-lg h-screen flex flex-col transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"}`}>
        <div className="flex items-center justify-between p-4 border-b">
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

        {isSidebarOpen && (
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-200 text-purple-800 rounded-full flex items-center justify-center text-lg font-bold">
                {teacher.fullName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{teacher.fullName}</h3>
                <p className="text-sm text-gray-500 truncate">{teacher.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 mt-4 px-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => setActiveTab(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1 ${
                activeTab === item.path
                  ? "bg-purple-100 text-purple-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {renderContent()}
      </div>

      {/* Modals - Upload, Profile, Accept, Reject, Complete */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Upload Study Material</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter material title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <select
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Grade</label>
                  <input
                    type="text"
                    value={uploadForm.grade}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 10th"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">File *</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUploadMaterial}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                Upload
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Similar modals for Profile, Accept Booking, Reject Booking, Complete Session */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-lg relative">
            <h2 className="text-2xl font-bold mb-1">Edit Profile</h2>
            <p className="text-gray-500 mb-6">Update your personal and teaching information. Required fields marked *</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!profileForm.fullName.trim() || !profileForm.email.trim()) {
                setError("Full name and email are required.");
                return;
              }
              setLoading(true);
              setError(null);
              try {
                const res = await fetch("/api/teacher/profile", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(profileForm),
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
                const updatedTeacher = await res.json();
                setDashboard(prev => ({ ...prev, teacher: { ...prev.teacher, ...updatedTeacher } }));
                setShowProfileModal(false);
                if (window?.toast) window.toast.success("Profile updated!");
                else alert("Profile updated!");
              } catch (err) {
                setError("Profile update failed. Network/server error.");
                if (window?.toast) window.toast.error("Profile update failed. Network/server error.");
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div>
                  <label className="block text-gray-500 mb-1">Full Name *</label>
                  <input type="text" className="w-full border rounded p-2 mb-3" value={profileForm.fullName} onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))} required />
                  <label className="block text-gray-500 mb-1">Email *</label>
                  <input type="email" className="w-full border rounded p-2 mb-3" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} required />
                  <label className="block text-gray-500 mb-1">Bio</label>
                  <textarea className="w-full border rounded p-2 mb-3" rows={3} value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} />
                  <label className="block text-gray-500 mb-1">Experience</label>
                  <textarea className="w-full border rounded p-2 mb-3" rows={2} value={profileForm.experience} onChange={e => setProfileForm(f => ({ ...f, experience: e.target.value }))} />
                  <label className="block text-gray-500 mb-1">Hourly Rate (₹)</label>
                  <input type="number" className="w-full border rounded p-2" value={profileForm.hourlyRate} onChange={e => setProfileForm(f => ({ ...f, hourlyRate: Number(e.target.value) }))} />
                </div>
                {/* Teaching Details */}
                <div>
                  <label className="block text-gray-500 mb-1">Subjects</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profileForm.subjects.map((subject, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg flex items-center gap-2">
                        {subject}
                        <button type="button" className="ml-1 text-xs" onClick={() => removeSubject(subject)}>&times;</button>
                      </span>
                    ))}
                  </div>
                  <input type="text" className="w-full border rounded p-2 mb-3" placeholder="Add subject and press Enter" value={newSubject} onChange={e => setNewSubject(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubject(); } }}/>
                  <label className="block text-gray-500 mb-1">Qualifications</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profileForm.qualifications.map((qual, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-600 rounded-lg flex items-center gap-2">
                        {qual}
                        <button type="button" className="ml-1 text-xs" onClick={() => removeQualification(qual)}>&times;</button>
                      </span>
                    ))}
                  </div>
                  <input type="text" className="w-full border rounded p-2 mb-3" placeholder="Add qualification and press Enter" value={newQualification} onChange={e => setNewQualification(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQualification(); } }}/>
                </div>
              </div>
              {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
              <div className="flex gap-4 mt-8">
                <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 focus:outline-none disabled:opacity-70" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300" onClick={() => setShowProfileModal(false)} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accept Booking Modal */}
      {showAcceptModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Accept Booking Request</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Student:</strong> {selectedBooking.studentId?.fullName || 'Student'}<br/>
                  <strong>Subject:</strong> {selectedBooking.subject}<br/>
                  <strong>Student Message:</strong> {selectedBooking.message || "No message provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Meeting Link (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="https://meet.google.com/..."
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
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                Accept Booking
              </button>
              <button 
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Reject Booking Request</h3>
            <div className="space-y-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Student:</strong> {selectedBooking.studentId?.fullName || 'Student'}<br/>
                  <strong>Subject:</strong> {selectedBooking.subject}<br/>
                  <strong>Student Message:</strong> {selectedBooking.message || "No message provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason for Rejection (Optional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="e.g., Not available at this time, Please book for a later slot..."
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
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Reject Booking
              </button>
              <button 
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Complete Session</h3>
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Student:</strong> {selectedBooking.studentId?.fullName || 'Student'}<br/>
                  <strong>Subject:</strong> {selectedBooking.subject}<br/>
                  <strong>Session Time:</strong> {selectedBooking.startTime ? new Date(selectedBooking.startTime).toLocaleString() : 'TBD'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Session Notes (Optional)</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Brief summary of what was covered in the session..."
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
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Complete Session
              </button>
              <button 
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
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