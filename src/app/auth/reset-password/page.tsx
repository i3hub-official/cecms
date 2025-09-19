"use client";
import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  CheckCircle,
  Shield,
  Key,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenFromUrl, setTokenFromUrl] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for token in URL parameters and remove it
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Remove token from URL for security
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      setFormData((prev) => ({ ...prev, token }));
      setTokenFromUrl(true);
      validateToken(token);
    }
  }, [searchParams, router]);

  const validateToken = async (token: string) => {
    setValidating(true);
    setError("");

    try {
      const response = await fetch("/api/auth/validate-reset-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setTokenValid(true);
        setError("");
      } else {
        setError(data.error || "Invalid or expired token");
        setTokenValid(false);
      }
    } catch (err) {
      setError("Failed to validate token. Please try again.");
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.token.trim()) {
      setError("Please enter a reset token");
      return;
    }
    await validateToken(formData.token.trim());
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      valid:
        minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar,
      requirements: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumber,
        hasSpecialChar,
      },
    };
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError("Password does not meet requirements");
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

  const resetToken = () => {
    setFormData((prev) => ({ ...prev, token: "" }));
    setTokenValid(false);
    setTokenFromUrl(false);
    setError("");
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
              {tokenValid
                ? "Enter your new password below"
                : "Enter your reset token to continue"}
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

            {!tokenValid ? (
              // Token Input Section
              <form onSubmit={handleTokenSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reset Token
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      name="token"
                      type="text"
                      required
                      className="appearance-none relative block w-full pl-10 pr-4 py-3 border border-border placeholder-muted-foreground text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-background"
                      placeholder="Enter your reset token"
                      value={formData.token}
                      onChange={handleChange}
                      disabled={validating}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The reset token was sent to your email address
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={validating || !formData.token.trim()}
                  className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {validating ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      <span>Validating token...</span>
                    </div>
                  ) : (
                    "Validate Token"
                  )}
                </button>
              </form>
            ) : (
              // Password Input Section
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {tokenFromUrl && (
                  <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Token validated successfully</span>
                    </div>
                    <button
                      type="button"
                      onClick={resetToken}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      Use different token
                    </button>
                  </div>
                )}

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
                      placeholder="Create a new password"
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
                  <p className="font-medium mb-2">Password requirements:</p>
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
              </form>
            )}

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
