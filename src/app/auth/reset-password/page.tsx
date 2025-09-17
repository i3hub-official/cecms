"use client";
import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  CheckCircle,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Extract token from URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      setFormData((prev) => ({ ...prev, token }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.token.trim()) {
      setError("Reset token is required");
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: formData.token.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ token: "", password: "", confirmPassword: "" });
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
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
            <h2 className="mt-6 text-2xl font-bold">
              Password Reset Successful!
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Your password has been successfully reset. You can now sign in
              with your new password.
            </p>
            <div className="mt-6">
              <a
                href="/auth/signin"
                className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Go to Sign In
              </a>
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
          {/* Header */}
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
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-3xl font-bold">Reset Password</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your reset token and new password below
            </p>
          </div>

          {/* Form */}
          <div className="mt-8 space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Reset Token Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Reset Token
                </label>
                <input
                  name="token"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-border placeholder-muted-foreground text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-background"
                  placeholder="Enter your reset token"
                  value={formData.token}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  The reset token was sent to your email address
                </p>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-border placeholder-muted-foreground text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-background"
                    placeholder="Create a new password (min. 8 characters)"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-border placeholder-muted-foreground text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-background"
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-muted-foreground">
              <p>Password must be at least 8 characters long</p>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    <span>Resetting password...</span>
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>

            {/* Back to Sign In Link */}
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <a
                  href="/auth/signin"
                  className="text-primary hover:text-primary/80 hover:underline transition-colors font-medium"
                >
                  Sign in here
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
