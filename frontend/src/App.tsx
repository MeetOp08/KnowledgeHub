import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Features from "./components/Features";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import StudyMaterials from "./components/StudyMaterials";
import AIChat from "./components/AIChat";
import LiveTutoring from "./components/LiveTutoring";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [userRole, setUserRole] = useState<"student" | "teacher" | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user.role);
          setUsername(data.user.email);

          // ✅ Redirect based on role
          if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup") {
            if (data.user.role === "teacher") {
              navigate("/teacher-dashboard", { replace: true });
            } else if (data.user.role === "student") {
              navigate("/student-dashboard", { replace: true });
            }
          }
        } else {
          setUserRole(null);
          setUsername(null);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, [location.pathname, navigate]);

  const handleLogin = (role: "student" | "teacher", userInfo: any) => {
    setUserRole(role);
    setUsername(userInfo.email);
    if (role === "teacher") navigate("/teacher-dashboard");
    else if (role === "student") navigate("/student-dashboard");
  };

  const handleSignUp = (role: "student" | "teacher", userInfo: any) => {
    setUserRole(role);
    setUsername(userInfo.email);
    if (role === "teacher") navigate("/teacher-dashboard");
    else navigate("/student-dashboard");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUserRole(null);
    setUsername(null);
    navigate("/");
  };

  if (loading) return <div>Loading...</div>;

  const isLoggedIn = !!userRole;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        activeSection={location.pathname}
        onNavigate={(path) => navigate(path)}
        isLoggedIn={isLoggedIn}
        username={username}
        role={userRole}
        onLogout={handleLogout}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Hero onGetStarted={() => navigate("/login")} />} />
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} onSwitchToSignUp={() => navigate("/signup")} onSwitchToForgotPassword={() => navigate("/forgot-password")} />}
        />
        <Route
          path="/signup"
          element={<SignUp onSignUp={handleSignUp} onSwitchToLogin={() => navigate("/login")} />}
        />
        <Route path="/forgot-password" element={<ForgotPassword onBackToLogin={() => navigate("/login")} />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route
  path="/teacher-dashboard"
  element={
    <ProtectedRoute isLoggedIn={isLoggedIn} allowedRole="teacher" userRole={userRole} loading={loading}>
      <TeacherDashboard />
    </ProtectedRoute>
  }
/>

        <Route
            path="/student-dashboard"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}   allowedRole="student" userRole={userRole} loading={loading}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Extra Public */}
        <Route path="/study-materials" element={<StudyMaterials />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/live-tutoring" element={<LiveTutoring />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
