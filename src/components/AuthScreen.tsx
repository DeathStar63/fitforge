"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || loading) return;

    setLoading(true);
    setError("");

    const { error } =
      mode === "signin"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (mode === "signup") {
      setError("");
      setMode("signin");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo & branding */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-black">F</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">FitForge</h1>
          <p className="text-sm text-text-muted mt-1">
            Your personal transformation tracker
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full bg-bg-input rounded-xl px-4 py-3.5 text-sm text-text-primary placeholder:text-text-subtle border border-border outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block font-medium">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full bg-bg-input rounded-xl px-4 py-3.5 pr-12 text-sm text-text-primary placeholder:text-text-subtle border border-border outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-subtle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-error"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-3.5 rounded-xl bg-accent text-bg-primary text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-sm text-text-muted mt-6">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }}
            className="text-accent font-semibold"
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </motion.div>
    </main>
  );
}
