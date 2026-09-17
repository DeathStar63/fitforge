"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, CheckCircle2, MailCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Mode = "signin" | "signup" | "forgot" | "new-password" | "check-email";

/** Turn raw Supabase/network errors into something a human can act on. */
function friendlyError(message: string) {
  const m = message.toLowerCase();
  // Safari says "Load failed", Chrome "Failed to fetch" — both mean the
  // request never reached Supabase (offline, flaky mobile data, blocked).
  if (
    m.includes("load failed") ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed")
  ) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (m.includes("email rate limit") || m.includes("rate limit")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (m.includes("error sending confirmation email") || m.includes("error sending")) {
    return "We couldn't send the confirmation email. Try again in a minute.";
  }
  return message;
}

export default function AuthScreen() {
  const { signIn, signUp, resetPassword, updatePassword, resendConfirmation, isPasswordRecovery } =
    useAuth();
  const [mode, setMode] = useState<Mode>(isPasswordRecovery ? "new-password" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resetSent, setResetSent] = useState(false);
  // Sign-in failed because the account exists but was never confirmed.
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const currentMode: Mode = isPasswordRecovery ? "new-password" : mode;

  const handleResend = async () => {
    if (resending || !email.trim()) return;
    setResending(true);
    setError("");
    const { error } = await resendConfirmation(email.trim());
    setResending(false);
    if (error) {
      setError(friendlyError(error.message));
    } else {
      setResent(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (currentMode === "forgot") {
      if (!email.trim() || loading) return;
      setLoading(true);
      const { error } = await resetPassword(email.trim());
      setLoading(false);
      if (error) {
        setError(friendlyError(error.message));
      } else {
        setResetSent(true);
      }
      return;
    }

    if (currentMode === "new-password") {
      if (!password.trim() || loading) return;
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      setLoading(true);
      const { error } = await updatePassword(password);
      setLoading(false);
      if (error) {
        setError(friendlyError(error.message));
      }
      return;
    }

    if (!email.trim() || !password.trim() || loading) return;

    if (currentMode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setNeedsConfirmation(false);

    if (currentMode === "signin") {
      const { error } = await signIn(email.trim(), password);
      setLoading(false);
      if (error) {
        // Account exists but the confirmation link was never clicked — give
        // them a way out instead of a dead end.
        if (error.message.toLowerCase().includes("not confirmed")) {
          setNeedsConfirmation(true);
          setError("Your email hasn't been confirmed yet.");
        } else {
          setError(friendlyError(error.message));
        }
      }
      return;
    }

    const { error, needsConfirmation: mustConfirm, alreadyRegistered } = await signUp(
      email.trim(),
      password
    );
    setLoading(false);

    if (error) {
      setError(friendlyError(error.message));
      return;
    }

    if (alreadyRegistered) {
      setMode("signin");
      setPassword("");
      setNotice("That email already has an account. Sign in instead.");
      return;
    }

    if (mustConfirm) {
      setResent(false);
      setMode("check-email");
      return;
    }

    // Confirmations are off — the session is live and <Home> swaps us out.
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
    setResetSent(false);
    setNeedsConfirmation(false);
    setResent(false);
    setPassword("");
    setConfirmPassword("");
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

        <AnimatePresence mode="wait">
          {/* ── Account created, waiting on email confirmation ── */}
          {currentMode === "check-email" && (
            <motion.div
              key="check-email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center space-y-4"
            >
              <MailCheck size={48} className="text-success mx-auto" />
              <h2 className="text-lg font-semibold text-text-primary">Confirm your email</h2>
              <p className="text-sm text-text-muted">
                We sent a confirmation link to{" "}
                <span className="font-medium text-text-primary">{email}</span>. Click it to
                activate your account, then sign in.
              </p>
              {error && <p className="text-sm text-error">{error}</p>}
              {resent && (
                <p className="text-sm text-success">Confirmation email sent again.</p>
              )}
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3.5 rounded-xl bg-bg-input border border-border text-sm font-semibold text-text-primary disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {resending && <Loader2 size={16} className="animate-spin" />}
                Resend email
              </button>
              <button
                onClick={() => switchMode("signin")}
                className="text-sm text-accent font-semibold"
              >
                Back to Sign In
              </button>
            </motion.div>
          )}

          {/* ── Set New Password (after clicking reset email link) ── */}
          {currentMode === "new-password" && (
            <motion.div
              key="new-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-text-primary mb-1">Set new password</h2>
              <p className="text-sm text-text-muted mb-6">Choose a strong password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block font-medium">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
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
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block font-medium">Confirm Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className="w-full bg-bg-input rounded-xl px-4 py-3.5 text-sm text-text-primary placeholder:text-text-subtle border border-border outline-none focus:border-accent transition-colors"
                  />
                </div>
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-error">
                    {error}
                  </motion.p>
                )}
                <button
                  type="submit"
                  disabled={loading || !password.trim() || !confirmPassword.trim()}
                  className="w-full py-3.5 rounded-xl bg-accent text-bg-primary text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Update Password
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Forgot Password ── */}
          {currentMode === "forgot" && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {resetSent ? (
                <div className="text-center space-y-4">
                  <CheckCircle2 size={48} className="text-success mx-auto" />
                  <h2 className="text-lg font-semibold text-text-primary">Check your email</h2>
                  <p className="text-sm text-text-muted">
                    We sent a password reset link to <span className="font-medium text-text-primary">{email}</span>. Click the link in the email to set a new password.
                  </p>
                  <button
                    onClick={() => switchMode("signin")}
                    className="text-sm text-accent font-semibold"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-text-primary mb-1">Forgot password?</h2>
                  <p className="text-sm text-text-muted mb-6">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs text-text-muted mb-1.5 block font-medium">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full bg-bg-input rounded-xl px-4 py-3.5 text-sm text-text-primary placeholder:text-text-subtle border border-border outline-none focus:border-accent transition-colors"
                      />
                    </div>
                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-error">
                        {error}
                      </motion.p>
                    )}
                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full py-3.5 rounded-xl bg-accent text-bg-primary text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />}
                      Send Reset Link
                    </button>
                  </form>
                  <p className="text-center text-sm text-text-muted mt-6">
                    <button onClick={() => switchMode("signin")} className="text-accent font-semibold">
                      Back to Sign In
                    </button>
                  </p>
                </>
              )}
            </motion.div>
          )}

          {/* ── Sign In / Sign Up ── */}
          {(currentMode === "signin" || currentMode === "signup") && (
            <motion.div
              key={currentMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block font-medium">Email</label>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-text-muted font-medium">Password</label>
                    {currentMode === "signin" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-accent font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      autoComplete={currentMode === "signin" ? "current-password" : "new-password"}
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

                {notice && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-text-muted">
                    {notice}
                  </motion.p>
                )}

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-error">
                    {error}
                  </motion.p>
                )}

                {needsConfirmation && (
                  <div className="space-y-2">
                    {resent ? (
                      <p className="text-sm text-success">
                        Confirmation email sent — check your inbox and spam folder.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="w-full py-3 rounded-xl bg-bg-input border border-border text-sm font-semibold text-text-primary disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {resending && <Loader2 size={16} className="animate-spin" />}
                        Resend confirmation email
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  className="w-full py-3.5 rounded-xl bg-accent text-bg-primary text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {currentMode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <p className="text-center text-sm text-text-muted mt-6">
                {currentMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => switchMode(currentMode === "signin" ? "signup" : "signin")}
                  className="text-accent font-semibold"
                >
                  {currentMode === "signin" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
