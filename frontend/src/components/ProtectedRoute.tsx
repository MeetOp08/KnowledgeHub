import { Navigate } from "react-router-dom";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";

interface ProtectedRouteProps {
  isLoggedIn: boolean;
  allowedRole?: "student" | "teacher";
  userRole: "student" | "teacher" | null;
  loading: boolean;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isLoggedIn,
  allowedRole,
  userRole,
  loading,
  children,
}) => {
  if (loading) {
    return <div className="p-6">Checking authentication...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    if (userRole === "student") return <StudentDashboard />;
    if (userRole === "teacher") return <TeacherDashboard />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
