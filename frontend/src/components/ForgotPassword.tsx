import React, { useMemo, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<MessageState>(null);
  const [loading, setLoading] = useState(false);

  const isSubmitDisabled = useMemo(() => loading || !email.trim(), [email, loading]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.success) {
        setMessage({ type: "success", text: "Password reset link sent. Check your email." });
        setEmail("");
      } else {
        setMessage({
          type: "error",
          text: data?.message || "We couldn't send the reset link. Please try again.",
        });
      }
    } catch (err) {
      console.error("Forgot password request failed:", err);
      setMessage({ type: "error", text: "Network error. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-2">Forgot Password</h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Enter the email you used to register and we'll send you a reset link.
        </p>

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
            role="status"
            aria-live="polite"
          >
            {message.text}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          Remembered your password?{" "}
          <button onClick={onBackToLogin} className="text-blue-600 hover:underline font-medium">
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
