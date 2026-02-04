"use client";
import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { notifySuccess, notifyError } from "@/app/components/ui/notifications";

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [autoSending, setAutoSending] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle URL parameters on component mount
  useEffect(() => {
    const message = searchParams.get("message");
    const error = searchParams.get("error");

    if (message) {
      notifySuccess(message);
      // Clear the message from URL
      router.replace("/auth/signin");
    }

    if (error) {
      notifyError(error);
      setError(error);
      // Clear the error from URL
      router.replace("/auth/signin");
    }
  }, [searchParams, router]);

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
    if (requiresVerification) setRequiresVerification(false); // reset verification state when user types
    if (resendSuccess) setResendSuccess(false); // clear resend success when user types
    if (autoSending) setAutoSending(false); // clear auto-sending state when user types
  };

  const autoSendVerificationEmail = async (email: string) => {
    setAutoSending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
      } else {
        if (data.alreadyVerified) {
          // User's email is already verified, they can sign in now
          setRequiresVerification(false);
          notifySuccess("Your email is already verified! You can now sign in.");
        } else {
          // Don't show error for auto-send, just silently fail
          // User can still manually resend if needed
        }
      }
    } catch (err) {
      // Silently handle auto-send errors
      // User can still manually resend if needed
    } finally {
      setAutoSending(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError("");
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setError(""); // Clear any existing errors
        setResendSuccess(true);
        // Don't show "verification email sent successfully" as an error-style message
      } else {
        if (data.alreadyVerified) {
          // User's email is already verified, they can sign in now
          setError("");
          setRequiresVerification(false); // Remove the verification block
          notifySuccess("Your email is already verified! You can now sign in.");
        } else if (data.retryAfter) {
          setError(
            `Please wait ${Math.ceil(
              data.retryAfter / 60
            )} minutes before requesting another verification email.`
          );
        } else {
          setError(data.error || "Failed to resend verification email");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setRequiresVerification(false);
    setResendSuccess(false);
    setAutoSending(false);

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
         router.push("/admin");
        }, 1500);
      } else {
        if (data.requiresVerification) {
          // Handle unverified email case
          setError(""); // Don't show the error in the error section
          setRequiresVerification(true);
          setUnverifiedEmail(data.email || formData.email);
          // Auto-send verification email
          autoSendVerificationEmail(data.email || formData.email);
        } else {
          setError(data.error || "Sign in failed");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      if (!success) {
        setLoading(false);
      }
    }
  };

  const isDisabled = loading || success || resendLoading || autoSending;

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

            {requiresVerification && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">
                      Email verification required
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                      Please check your email and click the verification link
                      before signing in.
                    </p>

                    {autoSending && (
                      <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 rounded-lg p-2 mb-2">
                        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center space-x-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 dark:border-blue-400"></div>
                          <span>Sending verification email...</span>
                        </p>
                      </div>
                    )}

                    {resendSuccess && !autoSending && (
                      <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/50 rounded-lg p-2 mb-2">
                        <p className="text-xs text-green-700 dark:text-green-300 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>
                            Verification email sent successfully! Please check
                            your inbox.
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendLoading || resendSuccess || autoSending}
                        className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendLoading ? (
                          <span className="flex items-center space-x-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600 dark:border-amber-400"></div>
                            <span>Sending...</span>
                          </span>
                        ) : resendSuccess ? (
                          "Email sent!"
                        ) : (
                          "Resend verification email"
                        )}
                      </button>
                      <Link
                        href="/auth/signup"
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Need help?
                      </Link>
                    </div>
                  </div>
                </div>
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
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    <span>Signing in...</span>
                  </div>
                ) : success ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Success! Redirecting...</span>
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
