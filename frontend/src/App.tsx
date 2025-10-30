import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import StudyMaterials from "./components/StudyMaterials";
import AIChat from "./components/AIChat";
import LiveTutoring from "./components/LiveTutoring";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Check session on load and route change
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);

          // Redirect logged-in users to their dashboards
          if (["/", "/login", "/signup"].includes(location.pathname)) {
            if (data.user.role === "teacher") navigate("/teacher/dashboard", { replace: true });
            else if (data.user.role === "student") navigate("/student/dashboard", { replace: true });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [location.pathname, navigate]);

  // ✅ Handle login and redirect by role
  const handleLogin = (role: "student" | "teacher", userInfo: any) => {
    setUser(userInfo);
    if (role === "teacher") navigate("/teacher/dashboard", { replace: true });
    else navigate("/student/dashboard", { replace: true });
  };

  // ✅ Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }
    setUser(null);
    navigate("/", { replace: true });
  };

  if (loading) return <div className="text-center mt-10">Checking session...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        activeSection={location.pathname}
        onNavigate={(path) => navigate(path)}
        isLoggedIn={!!user}
        username={user?.email}
        role={user?.role}
        onLogout={handleLogout}
      />

      <Routes>
        {/* ---------- Public Routes ---------- */}
        <Route path="/" element={<Hero onGetStarted={() => navigate("/login")} />} />
        <Route
          path="/login"
          element={
            <Login
              onLogin={handleLogin}
              onSwitchToSignUp={() => navigate("/signup")}
              onSwitchToForgotPassword={() => navigate("/forgot-password")}
            />
          }
        />
        <Route
          path="/signup"
          element={<SignUp onSignUp={handleLogin} onSwitchToLogin={() => navigate("/login")} />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword onBackToLogin={() => navigate("/login")} />}
        />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ---------- Protected Routes ---------- */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute isLoggedIn={!!user} userRole={user?.role} allowedRole="teacher" loading={loading}>
              <TeacherDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute isLoggedIn={!!user} userRole={user?.role} allowedRole="student" loading={loading}>
              <StudentDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* ---------- Public Resources ---------- */}
        <Route path="/study-materials" element={<StudyMaterials />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/live-tutoring" element={<LiveTutoring />} />

        {/* ---------- Fallback ---------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
