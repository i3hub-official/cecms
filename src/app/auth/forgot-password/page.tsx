"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
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

      // Always show success regardless of whether email exists (security best practice)
      setSuccess(true);
      if (data.resetToken) setResetToken(data.resetToken);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const isDisabled = loading || success;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-md w-full">
          <div className="bg-card/80 backdrop-blur-sm text-card-foreground rounded-2xl shadow-xl border border-border/50 p-8 text-center transition-all duration-300">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
              <CheckCircle className="h-10 w-10" />
            </div>

            <h2 className="mt-6 text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Check Your Email
            </h2>

            <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                If an account exists with{" "}
                <strong className="text-foreground">{email}</strong>, we&apos;ve
                sent a password reset link to your inbox.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Please check your spam folder if you don&apos;t see it within a
                few minutes.
              </p>
            </div>

            {resetToken && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl animate-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
                  <strong>Development Mode:</strong> Reset token:
                </p>
                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg">
                  <code className="text-xs text-amber-800 dark:text-amber-300 break-all font-mono">
                    {resetToken}
                  </code>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-3.5 px-4 text-sm font-medium rounded-xl border border-border text-foreground bg-background hover:bg-accent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Sign In
              </Link>

              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive an email?{" "}
                <button
                  onClick={() => {
                    setSuccess(false);
                    setLoading(false); // Reset loading state
                    setEmail("");
                    setError("");
                    setResetToken(""); // Also reset resetToken for consistency
                  }}
                  className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-card/80 backdrop-blur-sm text-card-foreground rounded-2xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl">
          <div className="text-center">
            <div className="text-left mb-6">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200 group"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-200">
                  ←
                </span>
                <span className="ml-1">Back to Home</span>
              </Link>
            </div>

            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
              <Mail className="h-8 w-8" />
            </div>

            <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Forgot Password?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              No worries! Enter your email address and we&apos;ll send you a
              secure link to reset your password.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                  <Mail
                    className={`h-5 w-5 transition-colors ${
                      isDisabled
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground group-focus-within:text-primary"
                    }`}
                  />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isDisabled}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                    isDisabled
                      ? "border-border/50 placeholder-muted-foreground/50 text-muted-foreground bg-muted/30 cursor-not-allowed"
                      : "border-border hover:border-border/80 placeholder-muted-foreground text-foreground bg-background"
                  }`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We&apos;ll send reset instructions to this email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              className={`group relative w-full flex justify-center py-3.5 px-4 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ${
                loading
                  ? "bg-primary/80 text-primary-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  <span>Sending reset link...</span>
                </div>
              ) : (
                <span className="group-hover:scale-105 transition-transform duration-200">
                  Send Reset Link
                </span>
              )}
            </button>

            <div className="text-center">
              <Link
                href="/auth/signin"
                className={`inline-flex items-center text-sm transition-colors ${
                  isDisabled
                    ? "text-muted-foreground/50 cursor-not-allowed pointer-events-none"
                    : "text-primary hover:text-primary/80 hover:underline group"
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}