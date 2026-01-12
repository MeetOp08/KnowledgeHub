import React, { useState } from "react";

interface SignUpProps {
  onSignUp: (role: "student" | "teacher", userInfo: any) => void;
  onSwitchToLogin: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignUp, onSwitchToLogin }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Basic validation
      if (!fullName.trim()) {
        setError("Full name is required");
        setLoading(false);
        return;
      }
      if (!normalizedEmail) {
        setError("Email is required");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: fullName, email: normalizedEmail, password, role }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Sign up successful!");
        onSignUp(role, data.user);
      } else {
        setError(data.message || "Sign up failed. Please try again.");
      }
    } catch (error) {
      console.error("❌ Sign up error:", error);
      setError("Unable to reach server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-purple-600 mb-2">
          Join KnowledgeHub
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Create your account to start learning.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          {/* Role Selection */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "student" | "teacher")}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
          >
            <option value="student">Sign up as Student</option>
            <option value="teacher">Sign up as Teacher</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-purple-600 hover:underline"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;