import React, { useState } from "react";
import { GraduationCap, Menu, X, User, LogOut } from "lucide-react";

interface HeaderProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  isLoggedIn: boolean;
  username: string | null;
  role: "student" | "teacher" | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  isLoggedIn,
  username,
  role,
  onLogout,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Show minimal header on auth pages
  const isAuthPage =
    activeSection.startsWith("/login") ||
    activeSection.startsWith("/signup") ||
    activeSection.startsWith("/forgot-password") ||
    activeSection.startsWith("/reset-password");

  // Navigation Items
  const guestNavItems = [
    { id: "/", label: "Home" },
    { id: "/live-tutoring", label: "Live Tutoring" },
    { id: "/ai-chat", label: "AI Chat" },
    { id: "/study-materials", label: "Study Materials" },
  ];

  const authTeacherNavItems = [
    { id: "/teacher/dashboard", label: "Teacher Dashboard" },
  ];

  const authStudentNavItems = [
    { id: "/student/dashboard", label: "Student Dashboard" },
    { id: "/live-tutoring", label: "Live Tutoring" },
    { id: "/ai-chat", label: "AI Chat" },
    { id: "/study-materials", label: "Study Materials" },
  ];

  const navItems = isLoggedIn
    ? role === "teacher"
      ? authTeacherNavItems
      : authStudentNavItems
    : guestNavItems;

  if (isAuthPage) {
    return (
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div
              className="flex items-center space-x-2 cursor-pointer group"
              onClick={() => onNavigate("/")}
            >
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                KnowledgeHub
              </span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => onNavigate("/")}
          >
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg group-hover:scale-105 transition-transform">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              KnowledgeHub
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn && username ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span>{username}</span>
                  {role && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                      {role}
                    </span>
                  )}
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onNavigate("/login")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate("/signup")}
                  className="ml-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-md animate-slide-down">
          <nav className="flex flex-col px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium text-left transition-colors ${
                  activeSection === item.id
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Auth Buttons (Mobile) */}
            {isLoggedIn && username ? (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span>{username}</span>
                  {role && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                      {role}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 mt-2">
                <button
                  onClick={() => {
                    onNavigate("/login");
                    setIsMenuOpen(false);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onNavigate("/signup");
                    setIsMenuOpen(false);
                  }}
                  className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
