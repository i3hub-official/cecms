"use client";
import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;

    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;

    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-destructive";
    if (passwordStrength < 85) return "bg-accent";
    return "bg-primary";
  };

  const getPasswordStrengthText = () => {
    if (!formData.password) return "";
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 85) return "Medium";
    return "Strong";
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      setLoading(false);
      return;
    }

    if (!formData.email) {
      setError("Email is required");
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setUserEmail(formData.email);
        setFormData({
          name: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setError(data.error || "Sign up failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setError(""); // Clear any existing errors
        // You could show a success message here
        alert("Verification email sent successfully! Please check your inbox.");
      } else {
        setError(data.error || "Failed to resend verification email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

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
                We&apos;ve sent a verification link to{" "}
                <strong className="text-foreground">{userEmail}</strong>.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Please verify your email address to activate your account.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Check your spam folder if you don&apos;t see it within a few minutes.
              </p>
            </div>
            {error && (
              <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full flex justify-center py-3.5 px-4 text-sm font-medium rounded-xl border border-border text-foreground bg-background hover:bg-accent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group"
              >
                {resendLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </div>
                )}
              </button>

              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-3.5 px-4 text-sm font-medium rounded-xl border border-border text-foreground bg-background hover:bg-accent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Sign In
              </Link>

              <p className="text-xs text-muted-foreground">
                Already verified your email?{" "}
                <Link
                  href="/auth/signin"
                  className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                >
                  Sign in here
                </Link>
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
          {/* Header */}
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
              <User className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Create Account
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Sign up to get started with your admin account
            </p>
          </div>

          {/* Form */}
          <div className="mt-8 space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                    <User
                      className={`h-5 w-5 transition-colors ${
                        loading
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground group-focus-within:text-primary"
                      }`}
                    />
                  </div>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    disabled={loading}
                    className={`block w-full pl-10 pr-3 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                      loading
                        ? "border-border/50 placeholder-muted-foreground/50 text-muted-foreground bg-muted/30 cursor-not-allowed"
                        : "border-border hover:border-border/80 placeholder-muted-foreground text-foreground bg-background"
                    }`}
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                    <User
                      className={`h-5 w-5 transition-colors ${
                        loading
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground group-focus-within:text-primary"
                      }`}
                    />
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    disabled={loading}
                    className={`block w-full pl-10 pr-3 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                      loading
                        ? "border-border/50 placeholder-muted-foreground/50 text-muted-foreground bg-muted/30 cursor-not-allowed"
                        : "border-border hover:border-border/80 placeholder-muted-foreground text-foreground bg-background"
                    }`}
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                    <Mail
                      className={`h-5 w-5 transition-colors ${
                        loading
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground group-focus-within:text-primary"
                      }`}
                    />
                  </div>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className={`block w-full pl-10 pr-3 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                      loading
                        ? "border-border/50 placeholder-muted-foreground/50 text-muted-foreground bg-muted/30 cursor-not-allowed"
                        : "border-border hover:border-border/80 placeholder-muted-foreground text-foreground bg-background"
                    }`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                    <Lock
                      className={`h-5 w-5 transition-colors ${
                        loading
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground group-focus-within:text-primary"
                      }`}
                    />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    className={`block w-full pl-10 pr-10 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                      loading
                        ? "border-border/50 placeholder-muted-foreground/50 text-muted-foreground bg-muted/30 cursor-not-allowed"
                        : "border-border hover:border-border/80 placeholder-muted-foreground text-foreground bg-background"
                    }`}
                    placeholder="Create a password (min. 8 characters)"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">
                        Password strength: {getPasswordStrengthText()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {passwordStrength}%
                      </span>
                    </div>
                    <div className="w-full bg-muted-foreground/20 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${getPasswordStrengthColor()} transition-all duration-300`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                    <Lock
                      className={`h-5 w-5 transition-colors ${
                        loading
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground group-focus-within:text-primary"
                      }`}
                    />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    className={`block w-full pl-10 pr-10 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                      loading
                        ? "border-border/50 placeholder-muted-foreground/50 text-muted-foreground bg-muted/30 cursor-not-allowed"
                        : "border-border hover:border-border/80 placeholder-muted-foreground text-foreground bg-background"
                    }`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                <p className="font-medium mb-1">Password requirements:</p>
                <ul className="space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• One uppercase letter (A-Z)</li>
                  <li>• One lowercase letter (a-z)</li>
                  <li>• One number (0-9)</li>
                  <li>• One special character (!@#$%^&* etc.)</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3.5 px-4 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ${
                  loading
                    ? "bg-primary/80 text-primary-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <span className="group-hover:scale-105 transition-transform duration-200">
                    Create Account
                  </span>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
