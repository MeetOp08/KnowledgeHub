import React from "react";
import { Navigate } from "react-router-dom";

// ✅ Define props interface properly
interface ProtectedRouteProps {
  isLoggedIn: boolean;
  allowedRole?: "student" | "teacher" | "admin"; // optional if route is open to all logged-in users
  userRole?: "student" | "teacher" | "admin";    // user's actual role
  loading: boolean;
  children: React.ReactNode;
}

// ✅ Functional component with proper typing
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isLoggedIn,
  allowedRole,
  userRole,
  loading,
  children,
}) => {
  // ⏳ Still checking auth
  if (loading) {
    return <div className="p-6 text-center text-gray-600">Checking authentication...</div>;
  }

  // 🚫 Not logged in → redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // 🔒 Role mismatch → redirect to appropriate dashboard
  if (allowedRole && userRole !== allowedRole) {
    if (userRole === "student") return <Navigate to="/student/dashboard" replace />;
    if (userRole === "teacher") return <Navigate to="/teacher/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // ✅ Authorized → render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
