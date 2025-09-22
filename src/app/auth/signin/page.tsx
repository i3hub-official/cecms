"use client";
import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(""); // clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Client-side validation
    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        sessionStorage.setItem("user", JSON.stringify(data.user));

        // Short delay to show success state
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1200);
      } else {
        setError(data.error || "Sign in failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      if (!success) {
        setLoading(false);
      }
    }
  };

  const isDisabled = loading || success;

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

            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg">
              {success ? (
                <CheckCircle className="h-8 w-8 animate-in zoom-in duration-300" />
              ) : (
                <Lock className="h-8 w-8" />
              )}
            </div>

            <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {success ? "Welcome back!" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {success
                ? "Redirecting to your dashboard..."
                : "Sign in to your account to continue"}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Sign in successful! Redirecting...
                </span>
              </div>
            )}

            <div className="space-y-5">
              {/* Email Field */}
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
                    name="email"
                    type="email"
                    autoComplete="email"
                    disabled={isDisabled}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                      isDisabled
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
                        isDisabled
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground group-focus-within:text-primary"
                      }`}
                    />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={isDisabled}
                    className={`appearance-none relative block w-full pl-10 pr-10 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                      isDisabled
                        ? "border-border/50 placeholder-muted-foreground/50 text-muted-foreground bg-muted/30 cursor-not-allowed"
                        : "border-border hover:border-border/80 placeholder-muted-foreground text-foreground bg-background"
                    }`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    disabled={isDisabled}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
                      isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                    onClick={() =>
                      !isDisabled && setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        className={`h-5 w-5 transition-colors ${
                          isDisabled
                            ? "text-muted-foreground/50"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      />
                    ) : (
                      <Eye
                        className={`h-5 w-5 transition-colors ${
                          isDisabled
                            ? "text-muted-foreground/50"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className={`text-sm transition-colors ${
                  isDisabled
                    ? "text-muted-foreground/50 cursor-not-allowed pointer-events-none"
                    : "text-primary hover:text-primary/80 hover:underline"
                }`}
              >
                Forgot your password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={isDisabled}
                className={`group relative w-full flex justify-center py-3.5 px-4 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ${
                  success
                    ? "bg-green-600 text-white cursor-default"
                    : loading
                    ? "bg-primary/80 text-primary-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {success ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Success! Redirecting...</span>
                  </div>
                ) : loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span className="group-hover:scale-105 transition-transform duration-200">
                    Sign in
                  </span>
                )}
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className={`font-medium transition-colors ${
                    isDisabled
                      ? "text-muted-foreground/50 cursor-not-allowed pointer-events-none"
                      : "text-primary hover:text-primary/80 hover:underline"
                  }`}
                >
                  Sign up here
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
