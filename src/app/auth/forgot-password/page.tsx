"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useTheme } from "../../components/ThemeContext";

export default function ForgotPasswordPage() {
  const { darkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        if (data.resetToken) setResetToken(data.resetToken);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full">
          <div className="bg-background text-foreground rounded-2xl shadow-sm border border-border p-8 text-center transition-colors duration-300">
            <div className="mx-auto h-16 w-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center transition-transform">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Check Your Email</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              If an account exists with <strong>{email}</strong>, we&apos;ve
              sent a password reset link.
            </p>

            {resetToken && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                  <strong>Dev Mode:</strong> Reset token:
                </p>
                <code className="text-xs bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded break-all text-yellow-800 dark:text-yellow-300">
                  {resetToken}
                </code>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Link
                href="/auth/reset-password"
                className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Go to Reset Password
              </Link>
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg border border-border text-foreground bg-background hover:bg-accent transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-background text-foreground rounded-2xl shadow-sm border border-border p-8 transition-colors duration-300">
          <div className="text-center">
            <div className="text-left mb-6">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-primary hover:underline transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
            <div className="mx-auto h-12 w-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center transition-transform">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-3xl font-bold">Forgot Password?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No worries! Enter your email and we&apos;ll send a reset link.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 rounded-lg border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-background"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  <span>Sending reset link...</span>
                </div>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <div className="text-center mt-2">
              <Link
                href="/auth/signin"
                className="inline-flex items-center text-sm text-primary hover:underline transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
