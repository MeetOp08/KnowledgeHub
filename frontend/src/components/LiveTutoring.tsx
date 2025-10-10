import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

interface Teacher {
  _id: string;
  name: string;
  subjects: string[];
  experience: string;
  rating: number;
  image?: string;
  status: "online" | "busy" | "offline";
  bio?: string;
}

const LiveTutoring: React.FC = () => {
  const [tutors, setTutors] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      const res = await axios.get("http://localhost:1234/api/teacher");
      setTutors(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers(); // initial fetch

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchTeachers, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = (id: string) => {
    alert(`Connecting to teacher ${id}`);
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Loading tutors...</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-4xl font-bold text-center mb-10 text-indigo-700">
        Live Tutoring
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tutors.map((tutor, index) => (
          <motion.div
            key={tutor._id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition"
          >
            {/* Profile */}
            <div className="flex items-center gap-4">
              <img
                src={
                  tutor.image ||
                  "https://via.placeholder.com/100x100.png?text=Tutor"
                }
                    alt={tutor.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h2 className="text-xl font-semibold">{tutor.name}</h2>
                <p className="text-gray-600">
                  {tutor.subjects.join(", ") || "No subjects"}
                </p>
                <p className="text-sm text-gray-500">{tutor.experience}</p>
                  </div>
                </div>

            {/* Status & Rating */}
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  tutor.status === "online"
                    ? "bg-green-100 text-green-600"
                    : tutor.status === "busy"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {tutor.status}
              </span>
              <span className="text-sm text-yellow-600 font-semibold">
                ⭐ {tutor.rating.toFixed(1)}
              </span>
                </div>

            {/* Connect button */}
                    <button
              onClick={() => handleConnect(tutor._id)}
              disabled={tutor.status !== "online"}
              className={`mt-5 w-full py-3 px-4 rounded-xl font-semibold ${
                tutor.status === "online"
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {tutor.status === "online" ? "Connect Now" : "Not Available"}
                    </button>

            {/* Bio */}
            {tutor.bio && (
              <p className="mt-3 text-sm text-gray-600">{tutor.bio}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LiveTutoring;
