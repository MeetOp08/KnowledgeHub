import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Download, Search, Eye, Clock, 
  FileText, Video, Image, Play, ArrowLeft, Users, 
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Material {
  _id: string;
  title: string;
  subject: string;
  type: 'pdf' | 'video' | 'notes' | 'quiz' | 'image';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  downloads: number;
  views: number;
  duration?: string;
  thumbnail?: string;
  description: string;
  fileUrl: string;
  teacherName: string;
  teacherId: string;
  createdAt: string;
  tags: string[];
}

interface Teacher {
  _id: string;
  fullName: string;
  email: string;
  subjects: string[];
  bio: string;
  experience: string;
}

interface Booking {
  _id: string;
  teacherId: string;
  subject: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  message: string;
  scheduledDate?: string;
  createdAt: string;
}

const StudyMaterials: React.FC = () => {
  const BACKEND_BASE = import.meta.env.VITE_API_URL || "";
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTeacherForBooking, setSelectedTeacherForBooking] = useState<Teacher | null>(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSubject, setBookingSubject] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const navigate = useNavigate();

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science', 'Economics'];
  const types = ['pdf', 'video', 'notes', 'quiz', 'image'];

  // Fetch materials from backend
  useEffect(() => {
    fetchMaterials();
    fetchTeachers();
    fetchBookings();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/study-materials', {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/booking/teachers', {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/booking/student/bookings', {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleBookTeacher = (teacher: Teacher) => {
    setSelectedTeacherForBooking(teacher);
    setBookingSubject('');
    setBookingMessage('');
    setScheduledDate('');
    setShowBookingModal(true);
  };

  const submitBooking = async () => {
    if (!selectedTeacherForBooking || !bookingSubject) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/booking/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          teacherId: selectedTeacherForBooking._id,
          subject: bookingSubject,
          message: bookingMessage,
          scheduledDate: scheduledDate || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Booking request sent successfully!');
        setShowBookingModal(false);
        fetchBookings();
      } else {
        alert(`Error: ${data.message || 'Failed to send booking request'}`);
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Error submitting booking request');
    }
  };

  const getTeacherMaterials = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/booking/teacher/${teacherId}/materials`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setMaterials(data.materials || []);
        setSelectedTeacher(teacherId);
      } else {
        alert(`Error: ${data.message || 'Failed to fetch teacher materials'}`);
      }
    } catch (error) {
      console.error('Error fetching teacher materials:', error);
      alert('Error fetching teacher materials');
    }
  };


  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject;
    const matchesType = selectedType === 'all' || material.type === selectedType;
    const matchesTeacher = selectedTeacher === 'all' || material.teacherId === selectedTeacher;
    return matchesSearch && matchesSubject && matchesType && matchesTeacher;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'video': return Video;
      case 'notes': return BookOpen;
      case 'quiz': return Image;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'text-red-600 bg-red-100';
      case 'video': return 'text-blue-600 bg-blue-100';
      case 'notes': return 'text-green-600 bg-green-100';
      case 'quiz': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // ✅ View material handler
  const handleView = async (material: Material) => {
    try {
      // Track view
      await fetch(`/api/study-materials/${material._id}/view`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (material.fileUrl) {
        // Construct full URL for uploaded files
        const fullUrl = material.fileUrl.startsWith('http') 
          ? material.fileUrl 
          : `${BACKEND_BASE}${material.fileUrl}`;
        window.open(fullUrl, '_blank');
      } else {
        alert(`Viewing for ${material.type} is not implemented yet.`);
      }
      
      // Update local state
      setMaterials(prev => prev.map(m => 
        m._id === material._id ? { ...m, views: m.views + 1 } : m
      ));
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  // ✅ Download handler
  const handleDownload = async (material: Material) => {
    try {
      // Track download
      await fetch(`/api/study-materials/${material._id}/download`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (material.fileUrl) {
        // Construct full URL for uploaded files
        const fullUrl = material.fileUrl.startsWith('http') 
          ? material.fileUrl 
          : `${BACKEND_BASE}${material.fileUrl}`;
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = material.title;
        link.click();
      } else {
        alert(`Download for ${material.type} is not implemented yet.`);
      }
      
      // Update local state
      setMaterials(prev => prev.map(m => 
        m._id === material._id ? { ...m, downloads: m.downloads + 1 } : m
      ));
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="mb-4 flex items-center text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Study Materials</h1>
          <p className="text-xl text-gray-600">Access comprehensive learning resources across all subjects</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
            </select>

            <select
              value={selectedTeacher}
              onChange={(e) => {
                setSelectedTeacher(e.target.value);
                if (e.target.value === 'all') {
                  fetchMaterials();
                } else {
                  getTeacherMaterials(e.target.value);
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>{teacher.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Teachers Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Available Teachers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map(teacher => {
              const hasBooking = bookings.find(b => b.teacherId === teacher._id);
              const isApproved = hasBooking?.status === 'approved' || hasBooking?.status === 'completed';
              
              return (
                <div key={teacher._id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{teacher.fullName}</h4>
                      <p className="text-sm text-gray-600">{teacher.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Experience: {teacher.experience || 'Not specified'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {teacher.subjects.map(subject => (
                          <span key={subject} className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isApproved && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  
                  {teacher.bio && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{teacher.bio}</p>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => getTeacherMaterials(teacher._id)}
                      className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition text-sm"
                    >
                      View Materials
                    </button>
                    {!hasBooking ? (
                      <button
                        onClick={() => handleBookTeacher(teacher)}
                        className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        Book
                      </button>
                    ) : (
                      <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        hasBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        hasBooking.status === 'approved' ? 'bg-green-100 text-green-800' :
                        hasBooking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {hasBooking.status.charAt(0).toUpperCase() + hasBooking.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading study materials...</p>
          </div>
        ) : (
          <>
            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => {
            const TypeIcon = getTypeIcon(material.type);
            return (
              <div key={material._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                <div className="relative">
                  <img
                    src={material.thumbnail ? 
                      (material.thumbnail.startsWith('http') ? material.thumbnail : `${material.thumbnail}`) :
                      'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400'
                    }
                    alt={material.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    {material.type === 'video' ? (
                      <Play className="h-12 w-12 text-white" />
                    ) : (
                      <Eye className="h-12 w-12 text-white" />
                    )}
                  </div>
                  <div className={`absolute top-4 left-4 px-2 py-1 rounded-lg text-xs font-medium ${getTypeColor(material.type)}`}>
                    <TypeIcon className="h-3 w-3 inline mr-1" />
                    {material.type.toUpperCase()}
                  </div>
                  {material.duration && (
                    <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded-lg text-xs">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {material.duration}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-600">{material.subject}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(material.difficulty)}`}>
                      {material.difficulty}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{material.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{material.description}</p>

                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>By: {material.teacherName}</span>
                      <div className="flex items-center space-x-1">
                        <Download className="h-4 w-4" />
                        <span>{material.downloads}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{material.views}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleView(material)} 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 text-sm font-medium"
                    >
                      View Material
                    </button>
                    <button 
                      onClick={() => handleDownload(material)} 
                      className="p-2 border border-gray-300 rounded-xl hover:border-purple-600 hover:text-purple-600 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

            {filteredMaterials.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No materials found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or filters</p>
              </div>
            )}
          </>
        )}

        {/* Booking Modal */}
        {showBookingModal && selectedTeacherForBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Book {selectedTeacherForBooking.fullName}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={bookingSubject}
                    onChange={(e) => setBookingSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select a subject</option>
                    {selectedTeacherForBooking.subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    placeholder="Tell the teacher about your learning goals..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={submitBooking}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
                >
                  Send Booking Request
                </button>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;
