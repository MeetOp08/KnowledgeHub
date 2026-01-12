import React, { useState, useEffect } from "react";

// Use Vite proxy in dev; override with VITE_API_URL in prod if needed
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface Booking {
  _id: string;
  studentId: {
    _id: string;
    fullName: string;
    email: string;
  };
  teacherId: string;
  subject: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "rejected" | "completed" | "cancelled";
  message?: string;
  meetingLink?: string;
  sessionNotes?: string;
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

const TeacherBookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");

  // Fetch teacher's bookings
  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking`, { credentials: 'include' });
      const data = await res.json();
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings. Please try again later.");
    } finally {
      setLoading(false);
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
    fetchBookings();
    fetchNotifications();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchBookings();
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle accept booking
  const handleAcceptBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setMeetingLink("");
    setError("");
    setShowAcceptModal(true);
  };

  // Accept booking
  const acceptBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/${selectedBooking._id}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ meetingLink: meetingLink || undefined })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Booking accepted successfully! Student has been notified and can now join the session.');
        setShowAcceptModal(false);
        fetchBookings();
        fetchNotifications();
      } else {
        setError(data.message || 'Failed to accept booking');
      }
    } catch (err) {
      console.error('Error accepting booking:', err);
      setError('Unable to reach server. Please try again later.');
    }
  };

  // Handle reject booking
  const handleRejectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectReason("");
    setError("");
    setShowRejectModal(true);
  };

  // Reject booking
  const rejectBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/${selectedBooking._id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason || undefined })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Booking rejected. Student has been notified that the teacher is not available and can book later.');
        setShowRejectModal(false);
        fetchBookings();
        fetchNotifications();
      } else {
        setError(data.message || 'Failed to reject booking');
      }
    } catch (err) {
      console.error('Error rejecting booking:', err);
      setError('Unable to reach server. Please try again later.');
    }
  };

  // Handle complete session
  const handleCompleteSession = (booking: Booking) => {
    setSelectedBooking(booking);
    setSessionNotes("");
    setError("");
    setShowCompleteModal(true);
  };

  // Complete session
  const completeSession = async () => {
    if (!selectedBooking) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/${selectedBooking._id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionNotes: sessionNotes || undefined })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Session completed successfully! Student has been notified to provide feedback.');
        setShowCompleteModal(false);
        fetchBookings();
        fetchNotifications();
      } else {
        setError(data.message || 'Failed to complete session');
      }
    } catch (err) {
      console.error('Error completing session:', err);
      setError('Unable to reach server. Please try again later.');
    }
  };

  // Generate meeting link
  const generateMeetingLink = () => {
    const meetingId = Math.random().toString(36).substring(2, 15);
    const meetingUrl = `https://meet.google.com/${meetingId}`;
    setMeetingLink(meetingUrl);
  };

  // Get status color
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

  if (loading) return <p className="text-center mt-10 text-gray-600">Loading bookings...</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-4xl font-bold text-center mb-10 text-indigo-700">Booking Management</h1>
      
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

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Notifications</h2>
          <div className="bg-white rounded-lg shadow-md p-4">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification._id}
                className={`p-3 mb-2 rounded-lg ${
                  notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-400'
                }`}
              >
                <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                <p className="text-gray-600 text-sm">{notification.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Booking Requests</h2>
        
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No booking requests yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {booking.studentId?.fullName ? booking.studentId.fullName[0].toUpperCase() : 'S'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {booking.studentId?.fullName || 'Student'}
                        </h3>
                        <p className="text-sm text-gray-500">{booking.studentId?.email || ''}</p>
                      </div>
                    </div>
                    <div className="ml-11">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Subject:</span> {booking.subject || 'General'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Date:</span> {new Date(booking.startTime).toLocaleDateString()} at {new Date(booking.startTime).toLocaleTimeString()}
                      </p>
                      {booking.message && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          <span className="font-medium">Message:</span> "{booking.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                {/* Action buttons based on status */}
                <div className="flex gap-3 flex-wrap">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAcceptBooking(booking)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        ✓ Accept Booking
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        ✗ Reject Booking
                      </button>
                    </>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => handleCompleteSession(booking)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Complete Session
                      </button>
                      {booking.meetingLink && (
                        <a
                          href={booking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
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
          </div>
        )}
      </div>

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
                onClick={acceptBooking}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
              >
                Accept Booking
              </button>
              <button 
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
                onClick={rejectBooking}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
              >
                Reject Booking
              </button>
              <button 
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
                  <strong>Session Time:</strong> {new Date(selectedBooking.startTime).toLocaleString()}
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
                onClick={completeSession}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
              >
                Complete Session
              </button>
              <button 
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

export default TeacherBookingManagement;
