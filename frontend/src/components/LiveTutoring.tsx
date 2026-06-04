import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Use Vite proxy in dev; override with VITE_API_URL in prod if needed
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface Teacher {
  _id: string;
  fullName: string;
  email: string;
  subjects: string[];
  bio?: string;
  experience?: string;
  availability: "available" | "busy" | "unavailable";
}

interface Booking {
  _id: string;
  teacherId: string;
  studentId: string;
  subject: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "rejected" | "completed" | "cancelled";
  message?: string;
  meetingLink?: string;
  sessionNotes?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
  relatedId?: string;
}

const LiveTutoring: React.FC = () => {
  const [tutors, setTutors] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [bookingSubject, setBookingSubject] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch teachers from booking API
  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/teachers`, { credentials: 'include' });
      const data = await res.json();
      setTutors(data.teachers || []);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to load teachers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch student's bookings
  const fetchMyBookings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/student/bookings`, { credentials: 'include' });
      const data = await res.json();
      setMyBookings(data.bookings || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, { credentials: 'include' });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchMyBookings();
    fetchNotifications();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchTeachers();
      fetchMyBookings();
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleBook = (teacher: Teacher) => {
    // Check if teacher is available
    if (teacher.availability === "busy") {
      setError("This teacher is currently busy with another session. Please try again later.");
      return;
    }
    
    setSelectedTeacher(teacher);
    setBookingSubject("");
    setBookingMessage("");
    setScheduledDate("");
    setError("");
    setSuccess("");
    setShowBookingModal(true);
  };

  const submitBooking = async () => {
    if (!selectedTeacher || !bookingSubject) {
      setError('Please select a subject.');
      return;
    }
    
    setError("");
    setSuccess("");
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teacherId: selectedTeacher._id,
          subject: bookingSubject,
          message: bookingMessage,
          scheduledDate: scheduledDate || null,
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Booking request sent successfully! The teacher will be notified.');
        setShowBookingModal(false);
        // Refresh data
        fetchMyBookings();
        fetchTeachers();
      } else {
        setError(data.message || 'Failed to send booking request');
      }
    } catch (err) {
      console.error('Error submitting booking:', err);
      setError('Unable to reach server. Please try again later.');
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        setSuccess('Booking deleted successfully!');
        fetchMyBookings();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete booking');
      }
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError('Unable to reach server. Please try again later.');
    }
  };

  // Get status color for bookings
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get availability color for teachers
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'unavailable': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Loading tutors...</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-4xl font-bold text-center mb-10 text-indigo-700">Live Tutoring & Booking</h1>
      
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 max-w-4xl mx-auto">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-4xl mx-auto">
          {error}
        </div>
      )}

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Notifications</h2>
          <div className="bg-white rounded-lg shadow-md p-4">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification._id}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                  notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-400'
                }`}
                onClick={() => !notification.isRead && markNotificationAsRead(notification._id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                    <p className="text-gray-600 text-sm">{notification.message}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    notification.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {notification.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Bookings */}
      {myBookings.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">My Bookings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myBookings.slice(0, 4).map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{booking.subject}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    {(booking.status === 'pending' || booking.status === 'rejected') && (
                      <button
                        onClick={() => deleteBooking(booking._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Delete booking"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(booking.startTime).toLocaleDateString()} at {new Date(booking.startTime).toLocaleTimeString()}
                </p>
                {booking.message && (
                  <p className="text-sm text-gray-700 mt-1 italic">"{booking.message}"</p>
                )}
                {booking.meetingLink && booking.status === 'confirmed' && (
                  <a
                    href={booking.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Join Session
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Available Tutors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map((tutor, index) => (
            <motion.div
              key={tutor._id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition relative"
            >
              {/* Availability Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(tutor.availability)}`}>
                  {tutor.availability}
                </span>
              </div>

              {/* Profile */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-lg">
                    {tutor.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{tutor.fullName}</h2>
                  <p className="text-gray-600 text-sm">{tutor.email}</p>
                  {tutor.experience && (
                    <p className="text-sm text-gray-500">{tutor.experience}</p>
                  )}
                </div>
              </div>

              {/* Subjects */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Subjects:</h3>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects?.map((s) => (
                    <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bio */}
              {tutor.bio && (
                <p className="text-sm text-gray-600 mb-4">{tutor.bio}</p>
              )}

              {/* Book button */}
              <button
                onClick={() => handleBook(tutor)}
                disabled={tutor.availability === "busy"}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition ${
                  tutor.availability === "busy"
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {tutor.availability === "busy" ? "Currently Busy" : "Book Session"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {showBookingModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Book {selectedTeacher.fullName}</h3>
            
            {/* Error message in modal */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <select
                  value={bookingSubject}
                  onChange={(e) => setBookingSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a subject</option>
                  {selectedTeacher.subjects?.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message (optional)</label>
                <textarea
                  value={bookingMessage}
                  onChange={(e) => setBookingMessage(e.target.value)}
                  placeholder="Describe what you need help with..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date & Time (optional)</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for immediate booking</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={submitBooking} 
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
              >
                Send Request
              </button>
              <button 
                onClick={() => {
                  setShowBookingModal(false);
                  setError("");
                }} 
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

export default LiveTutoring;
  