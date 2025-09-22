
"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  CheckCircle,
  Shield,
  Key,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

interface PasswordValidation {
  valid: boolean;
  requirements: PasswordRequirements;
  score: number;
}

interface FormData {
  token: string;
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState<FormData>({
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
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract token from URL on mount
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
  }, [searchParams]);

  // Validate reset token
  const validateToken = useCallback(async (token: string) => {
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
  }, []);

  // Enhanced password validation with scoring
  const validatePassword = useCallback(
    (password: string): PasswordValidation => {
      const minLength = password.length >= 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      const requirements = {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumber,
        hasSpecialChar,
      };

      const score = Object.values(requirements).filter(Boolean).length;
      const valid = score === 5;

      return { valid, requirements, score };
    },
    []
  );

  // Memoized password validation result
  const passwordValidation = useMemo(
    () => validatePassword(formData.password),
    [formData.password, validatePassword]
  );

  // Check if passwords match
  const passwordsMatch = useMemo(
    () => formData.password === formData.confirmPassword,
    [formData.password, formData.confirmPassword]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedToken = formData.token.trim();

    if (!trimmedToken) {
      setError("Please enter a reset token");
      return;
    }

    await validateToken(trimmedToken);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation display
    setTouched({ password: true, confirmPassword: true });

    setLoading(true);
    setError("");

    // Validation
    if (!passwordValidation.valid) {
      setError("Password does not meet all requirements");
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
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

  // Password strength indicator
  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return "bg-red-500";
    if (score === 3) return "bg-yellow-500";
    if (score === 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return "Weak";
    if (score === 3) return "Fair";
    if (score === 4) return "Good";
    return "Strong";
  };

  const isDisabled = loading || success || validating;

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-md w-full">
          <div className="bg-card/80 backdrop-blur-sm text-card-foreground rounded-2xl shadow-xl border border-border/50 p-8 text-center transition-all duration-300">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
              <CheckCircle className="h-10 w-10" />
            </div>
            
            <h1 className="mt-6 text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Password Reset Successful!
            </h1>
            
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800/50">
              <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>
            
            <div className="mt-8">
              <Link
                href="/auth/signin"
                className="inline-flex w-full justify-center py-3.5 px-4 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
              >
                Go to Sign In
              </Link>
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
                className="inline-flex items-center text-sm text-primary hover:text-primary/80 hover:underline transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
                <span className="ml-1">Back to Home</span>
              </Link>
            </div>
            
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8" />
            </div>
            
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Reset Password
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {tokenValid
                ? "Create a new secure password for your account"
                : "Enter your reset token to continue"}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-destructive/10 border border-destructive/20 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-destructive">
                    Error
                  </h3>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Form */}
          <div className="mt-8 space-y-6">
            {!tokenValid ? (
              // Token Input Section
              <form onSubmit={handleTokenSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="token"
                    className="block text-sm font-medium text-foreground"
                  >
                    Reset Token
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                      <Key className={`h-5 w-5 transition-colors ${
                        isDisabled ? 'text-muted-foreground/50' : 'text-muted-foreground group-focus-within:text-primary'
                      }`} />
                    </div>
                    <input
                      id="token"
                      name="token"
                      type="text"
                      required
                      disabled={isDisabled}
                      aria-describedby="token-description"
                      className={`appearance-none relative block w-full pl-10 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                        isDisabled 
                          ? 'border-border/50 placeholder-muted-foreground/50 text-muted-foreground bg-muted/30 cursor-not-allowed' 
                          : 'border-border hover:border-border/80 placeholder-muted-foreground text-foreground bg-background'
                      }`}
                      placeholder="Enter your reset token"
                      value={formData.token}
                      onChange={handleChange}
                    />
                  </div>
                  <p
                    id="token-description"
                    className="text-xs text-muted-foreground"
                  >
                    The reset token was sent to your email address
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isDisabled || !formData.token.trim()}
                  className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {validating ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      <span>Validating token...</span>
                    </div>
                  ) : (
                    <span className="group-hover:scale-105 transition-transform duration-200">
                      Validate Token
                    </span>
                  )}
                </button>
              </form>
            ) : (
              // Password Reset Section
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {tokenFromUrl && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-xl p-4 text-sm animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-800 dark:text-green-300 font-medium">
                        Token validated successfully
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={resetToken}
                      disabled={isDisabled}
                      className="mt-2 text-xs text-primary hover:text-primary/80 hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Use different token
                    </button>
                  </div>
                )}

                {/* New Password Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground"
                  >
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                      <Lock className={`h-5 w-5 transition-colors ${
                        isDisabled ? 'text-muted-foreground/50' : 'text-muted-foreground group-focus-within:text-primary'
                      }`} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      disabled={isDisabled}
                      aria-describedby="password-requirements"
                      className={`appearance-none relative block w-full pl-10 pr-10 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                        isDisabled 
                          ? 'border-border/50 placeholder-muted-foreground/50 text-muted-foreground bg-muted/30 cursor-not-allowed' 
                          : touched.password && !passwordValidation.valid
                          ? "border-red-300 hover:border-red-400 placeholder-muted-foreground text-foreground bg-background"
                          : "border-border hover:border-border/80 placeholder-muted-foreground text-foreground bg-background"
                      }`}
                      placeholder="Create a new password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur("password")}
                    />
                    <button
                      type="button"
                      disabled={isDisabled}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded disabled:cursor-not-allowed"
                      onClick={() => !isDisabled && setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className={`h-5 w-5 transition-colors ${
                          isDisabled ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'
                        }`} />
                      ) : (
                        <Eye className={`h-5 w-5 transition-colors ${
                          isDisabled ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'
                        }`} />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">
                          Password strength:
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            passwordValidation.score <= 2
                              ? "text-red-600"
                              : passwordValidation.score === 3
                              ? "text-yellow-600"
                              : passwordValidation.score === 4
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        >
                          {getPasswordStrengthText(passwordValidation.score)}
                        </span>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(
                            passwordValidation.score
                          )}`}
                          style={{
                            width: `${(passwordValidation.score / 5) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-foreground"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                      <Lock className={`h-5 w-5 transition-colors ${
                        isDisabled ? 'text-muted-foreground/50' : 'text-muted-foreground group-focus-within:text-primary'
                      }`} />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      disabled={isDisabled}
                      className={`appearance-none relative block w-full pl-10 pr-10 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all duration-200 ${
                        isDisabled 
                          ? 'border-border/50 placeholder-muted-foreground/50 text-muted-foreground bg-muted/30 cursor-not-allowed' 
                          : touched.confirmPassword &&
                        formData.confirmPassword &&
                        !passwordsMatch
                          ? "border-red-300 hover:border-red-400 placeholder-muted-foreground text-foreground bg-background"
                          : "border-border hover:border-border/80 placeholder-muted-foreground text-foreground bg-background"
                      }`}
                      placeholder="Confirm your new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => handleBlur("confirmPassword")}
                    />
                    <button
                      type="button"
                      disabled={isDisabled}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded disabled:cursor-not-allowed"
                      onClick={() =>
                        !isDisabled && setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide password confirmation"
                          : "Show password confirmation"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className={`h-5 w-5 transition-colors ${
                          isDisabled ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'
                        }`} />
                      ) : (
                        <Eye className={`h-5 w-5 transition-colors ${
                          isDisabled ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'
                        }`} />
                      )}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {touched.confirmPassword && formData.confirmPassword && (
                    <div
                      className={`mt-1 flex items-center space-x-1 text-xs ${
                        passwordsMatch ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {passwordsMatch ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3" />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Password Requirements */}
                <div
                  id="password-requirements"
                  className="bg-muted/20 border border-border/50 rounded-xl p-4 text-xs"
                >
                  <p className="font-medium mb-3 text-foreground">
                    Password requirements:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries({
                      minLength: "At least 8 characters long",
                      hasUpperCase: "One uppercase letter (A-Z)",
                      hasLowerCase: "One lowercase letter (a-z)",
                      hasNumber: "One number (0-9)",
                      hasSpecialChar: "One special character (!@#$%^&* etc.)",
                    }).map(([key, label]) => (
                      <div
                        key={key}
                        className={`flex items-center space-x-2 transition-colors ${
                          passwordValidation.requirements[
                            key as keyof PasswordRequirements
                          ]
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {passwordValidation.requirements[
                          key as keyof PasswordRequirements
                        ] ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={
                    isDisabled || !passwordValidation.valid || !passwordsMatch
                  }
                  className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      <span>Resetting password...</span>
                    </div>
                  ) : (
                    <span className="group-hover:scale-105 transition-transform duration-200">
                      Reset Password
                    </span>
                  )}
                </button>
              </form>
            )}

            {/* Back to Sign In Link */}
            <div className="text-center pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/auth/signin"
                  className={`font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded ${
                    isDisabled 
                      ? 'text-muted-foreground/50 cursor-not-allowed pointer-events-none' 
                      : 'text-primary hover:text-primary/80 hover:underline'
                  }`}
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


// "use client";
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import {
//   Eye,
//   EyeOff,
//   Lock,
//   AlertCircle,
//   CheckCircle,
//   Shield,
//   Key,
//   Check,
//   X,
// } from "lucide-react";
// import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";

// interface PasswordRequirements {
//   minLength: boolean;
//   hasUpperCase: boolean;
//   hasLowerCase: boolean;
//   hasNumber: boolean;
//   hasSpecialChar: boolean;
// }

// interface PasswordValidation {
//   valid: boolean;
//   requirements: PasswordRequirements;
//   score: number;
// }

// interface FormData {
//   token: string;
//   password: string;
//   confirmPassword: string;
// }

// export default function ResetPasswordPage() {
//   const [formData, setFormData] = useState<FormData>({
//     token: "",
//     password: "",
//     confirmPassword: "",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [validating, setValidating] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState(false);
//   const [tokenValid, setTokenValid] = useState(false);
//   const [tokenFromUrl, setTokenFromUrl] = useState(false);
//   const [touched, setTouched] = useState({
//     password: false,
//     confirmPassword: false,
//   });

//   const router = useRouter();
//   const searchParams = useSearchParams();

//   // Extract token from URL on mount
//   useEffect(() => {
//     const token = searchParams.get("token");
//     if (token) {
//       // Remove token from URL for security
//       const newUrl = window.location.pathname;
//       window.history.replaceState({}, document.title, newUrl);

//       setFormData((prev) => ({ ...prev, token }));
//       setTokenFromUrl(true);
//       validateToken(token);
//     }
//   }, [searchParams]);

//   // Validate reset token
//   const validateToken = useCallback(async (token: string) => {
//     setValidating(true);
//     setError("");

//     try {
//       const response = await fetch("/api/auth/validate-reset-token", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ token }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         setTokenValid(true);
//         setError("");
//       } else {
//         setError(data.error || "Invalid or expired token");
//         setTokenValid(false);
//       }
//     } catch (err) {
//       setError("Failed to validate token. Please try again.");
//       setTokenValid(false);
//     } finally {
//       setValidating(false);
//     }
//   }, []);

//   // Enhanced password validation with scoring
//   const validatePassword = useCallback(
//     (password: string): PasswordValidation => {
//       const minLength = password.length >= 8;
//       const hasUpperCase = /[A-Z]/.test(password);
//       const hasLowerCase = /[a-z]/.test(password);
//       const hasNumber = /\d/.test(password);
//       const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

//       const requirements = {
//         minLength,
//         hasUpperCase,
//         hasLowerCase,
//         hasNumber,
//         hasSpecialChar,
//       };

//       const score = Object.values(requirements).filter(Boolean).length;
//       const valid = score === 5;

//       return { valid, requirements, score };
//     },
//     []
//   );

//   // Memoized password validation result
//   const passwordValidation = useMemo(
//     () => validatePassword(formData.password),
//     [formData.password, validatePassword]
//   );

//   // Check if passwords match
//   const passwordsMatch = useMemo(
//     () => formData.password === formData.confirmPassword,
//     [formData.password, formData.confirmPassword]
//   );

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));

//     // Clear error when user starts typing
//     if (error) setError("");
//   };

//   const handleBlur = (field: keyof typeof touched) => {
//     setTouched((prev) => ({ ...prev, [field]: true }));
//   };

//   const handleTokenSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const trimmedToken = formData.token.trim();

//     if (!trimmedToken) {
//       setError("Please enter a reset token");
//       return;
//     }

//     await validateToken(trimmedToken);
//   };

//   const handlePasswordSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Mark all fields as touched for validation display
//     setTouched({ password: true, confirmPassword: true });

//     setLoading(true);
//     setError("");

//     // Validation
//     if (!passwordValidation.valid) {
//       setError("Password does not meet all requirements");
//       setLoading(false);
//       return;
//     }

//     if (!passwordsMatch) {
//       setError("Passwords do not match");
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await fetch("/api/auth/reset-password", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           token: formData.token.trim(),
//           password: formData.password,
//         }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setSuccess(true);
//         setFormData({ token: "", password: "", confirmPassword: "" });
//       } else {
//         setError(data.error || "Failed to reset password");
//       }
//     } catch (err) {
//       setError("Network error. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetToken = () => {
//     setFormData((prev) => ({ ...prev, token: "" }));
//     setTokenValid(false);
//     setTokenFromUrl(false);
//     setError("");
//   };

//   // Password strength indicator
//   const getPasswordStrengthColor = (score: number) => {
//     if (score <= 2) return "bg-red-500";
//     if (score === 3) return "bg-yellow-500";
//     if (score === 4) return "bg-blue-500";
//     return "bg-green-500";
//   };

//   const getPasswordStrengthText = (score: number) => {
//     if (score <= 2) return "Weak";
//     if (score === 3) return "Fair";
//     if (score === 4) return "Good";
//     return "Strong";
//   };

//   // Success state
//   if (success) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-4 bg-background">
//         <div className="max-w-md w-full">
//           <div className="bg-background text-foreground rounded-2xl shadow-sm border border-border p-8 text-center transition-colors duration-300">
//             <div className="mx-auto h-16 w-16 bg-green-500 text-white rounded-full flex items-center justify-center">
//               <CheckCircle className="h-8 w-8" />
//             </div>
//             <h1 className="mt-6 text-2xl font-bold">
//               Password Reset Successful!
//             </h1>
//             <p className="mt-4 text-sm text-muted-foreground">
//               Your password has been successfully reset. You can now sign in
//               with your new password.
//             </p>
//             <div className="mt-6">
//               <Link
//                 href="/auth/signin"
//                 className="inline-flex w-full justify-center py-3 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
//               >
//                 Go to Sign In
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-background">
//       <div className="max-w-md w-full space-y-8">
//         <div className="bg-background text-foreground rounded-2xl shadow-sm border border-border p-8 transition-colors duration-300">
//           {/* Header */}
//           <div className="text-center">
//             <div className="text-left mb-6">
//               <Link
//                 href="/"
//                 className="inline-flex items-center text-sm text-primary hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
//               >
//                 ← Back to Home
//               </Link>
//             </div>
//             <div className="mx-auto h-12 w-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center">
//               <Shield className="h-6 w-6" />
//             </div>
//             <h1 className="mt-6 text-3xl font-bold">Reset Password</h1>
//             <p className="mt-2 text-sm text-muted-foreground">
//               {tokenValid
//                 ? "Enter your new password below"
//                 : "Enter your reset token to continue"}
//             </p>
//           </div>

//           {/* Error Display */}
//           {error && (
//             <div className="mt-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
//               <div className="flex items-start space-x-3">
//                 <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
//                 <div>
//                   <h3 className="text-sm font-medium text-destructive">
//                     Error
//                   </h3>
//                   <p className="text-sm text-destructive/80 mt-1">{error}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Main Form */}
//           <div className="mt-8 space-y-6">
//             {!tokenValid ? (
//               // Token Input Section
//               <form onSubmit={handleTokenSubmit} className="space-y-4">
//                 <div>
//                   <label
//                     htmlFor="token"
//                     className="block text-sm font-medium text-foreground mb-1"
//                   >
//                     Reset Token
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <Key className="h-5 w-5 text-muted-foreground" />
//                     </div>
//                     <input
//                       id="token"
//                       name="token"
//                       type="text"
//                       required
//                       aria-describedby="token-description"
//                       className="appearance-none relative block w-full pl-10 pr-4 py-3 border border-border placeholder-muted-foreground text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-background"
//                       placeholder="Enter your reset token"
//                       value={formData.token}
//                       onChange={handleChange}
//                       disabled={validating}
//                     />
//                   </div>
//                   <p
//                     id="token-description"
//                     className="mt-1 text-xs text-muted-foreground"
//                   >
//                     The reset token was sent to your email address
//                   </p>
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={validating || !formData.token.trim()}
//                   className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   {validating ? (
//                     <div className="flex items-center space-x-2">
//                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
//                       <span>Validating token...</span>
//                     </div>
//                   ) : (
//                     "Validate Token"
//                   )}
//                 </button>
//               </form>
//             ) : (
//               // Password Reset Section
//               <form onSubmit={handlePasswordSubmit} className="space-y-6">
//                 {tokenFromUrl && (
//                   <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
//                     <div className="flex items-center space-x-2">
//                       <CheckCircle className="h-4 w-4 text-green-600" />
//                       <span className="text-green-800">
//                         Token validated successfully
//                       </span>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={resetToken}
//                       className="mt-2 text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
//                     >
//                       Use different token
//                     </button>
//                   </div>
//                 )}

//                 {/* New Password Field */}
//                 <div>
//                   <label
//                     htmlFor="password"
//                     className="block text-sm font-medium text-foreground mb-1"
//                   >
//                     New Password
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <Lock className="h-5 w-5 text-muted-foreground" />
//                     </div>
//                     <input
//                       id="password"
//                       name="password"
//                       type={showPassword ? "text" : "password"}
//                       autoComplete="new-password"
//                       required
//                       aria-describedby="password-requirements"
//                       className={`appearance-none relative block w-full pl-10 pr-10 py-3 border placeholder-muted-foreground text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-background ${
//                         touched.password && !passwordValidation.valid
//                           ? "border-red-300"
//                           : "border-border"
//                       }`}
//                       placeholder="Create a new password"
//                       value={formData.password}
//                       onChange={handleChange}
//                       onBlur={() => handleBlur("password")}
//                     />
//                     <button
//                       type="button"
//                       className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
//                       onClick={() => setShowPassword(!showPassword)}
//                       aria-label={
//                         showPassword ? "Hide password" : "Show password"
//                       }
//                     >
//                       {showPassword ? (
//                         <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
//                       ) : (
//                         <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
//                       )}
//                     </button>
//                   </div>

//                   {/* Password Strength Indicator */}
//                   {formData.password && (
//                     <div className="mt-2">
//                       <div className="flex justify-between items-center mb-1">
//                         <span className="text-xs text-muted-foreground">
//                           Password strength:
//                         </span>
//                         <span
//                           className={`text-xs font-medium ${
//                             passwordValidation.score <= 2
//                               ? "text-red-600"
//                               : passwordValidation.score === 3
//                               ? "text-yellow-600"
//                               : passwordValidation.score === 4
//                               ? "text-blue-600"
//                               : "text-green-600"
//                           }`}
//                         >
//                           {getPasswordStrengthText(passwordValidation.score)}
//                         </span>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-2">
//                         <div
//                           className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(
//                             passwordValidation.score
//                           )}`}
//                           style={{
//                             width: `${(passwordValidation.score / 5) * 100}%`,
//                           }}
//                         ></div>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Confirm Password Field */}
//                 <div>
//                   <label
//                     htmlFor="confirmPassword"
//                     className="block text-sm font-medium text-foreground mb-1"
//                   >
//                     Confirm New Password
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <Lock className="h-5 w-5 text-muted-foreground" />
//                     </div>
//                     <input
//                       id="confirmPassword"
//                       name="confirmPassword"
//                       type={showConfirmPassword ? "text" : "password"}
//                       autoComplete="new-password"
//                       required
//                       className={`appearance-none relative block w-full pl-10 pr-10 py-3 border placeholder-muted-foreground text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors bg-background ${
//                         touched.confirmPassword &&
//                         formData.confirmPassword &&
//                         !passwordsMatch
//                           ? "border-red-300"
//                           : "border-border"
//                       }`}
//                       placeholder="Confirm your new password"
//                       value={formData.confirmPassword}
//                       onChange={handleChange}
//                       onBlur={() => handleBlur("confirmPassword")}
//                     />
//                     <button
//                       type="button"
//                       className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
//                       onClick={() =>
//                         setShowConfirmPassword(!showConfirmPassword)
//                       }
//                       aria-label={
//                         showConfirmPassword
//                           ? "Hide password confirmation"
//                           : "Show password confirmation"
//                       }
//                     >
//                       {showConfirmPassword ? (
//                         <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
//                       ) : (
//                         <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
//                       )}
//                     </button>
//                   </div>

//                   {/* Password Match Indicator */}
//                   {touched.confirmPassword && formData.confirmPassword && (
//                     <div
//                       className={`mt-1 flex items-center space-x-1 text-xs ${
//                         passwordsMatch ? "text-green-600" : "text-red-600"
//                       }`}
//                     >
//                       {passwordsMatch ? (
//                         <>
//                           <Check className="h-3 w-3" />
//                           <span>Passwords match</span>
//                         </>
//                       ) : (
//                         <>
//                           <X className="h-3 w-3" />
//                           <span>Passwords do not match</span>
//                         </>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Password Requirements */}
//                 <div
//                   id="password-requirements"
//                   className="bg-muted/30 rounded-lg p-4 text-xs"
//                 >
//                   <p className="font-medium mb-3 text-foreground">
//                     Password requirements:
//                   </p>
//                   <div className="grid grid-cols-1 gap-2">
//                     {Object.entries({
//                       minLength: "At least 8 characters long",
//                       hasUpperCase: "One uppercase letter (A-Z)",
//                       hasLowerCase: "One lowercase letter (a-z)",
//                       hasNumber: "One number (0-9)",
//                       hasSpecialChar: "One special character (!@#$%^&* etc.)",
//                     }).map(([key, label]) => (
//                       <div
//                         key={key}
//                         className={`flex items-center space-x-2 transition-colors ${
//                           passwordValidation.requirements[
//                             key as keyof PasswordRequirements
//                           ]
//                             ? "text-green-600"
//                             : "text-muted-foreground"
//                         }`}
//                       >
//                         {passwordValidation.requirements[
//                           key as keyof PasswordRequirements
//                         ] ? (
//                           <Check className="h-3 w-3" />
//                         ) : (
//                           <X className="h-3 w-3" />
//                         )}
//                         <span>{label}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Submit Button */}
//                 <button
//                   type="submit"
//                   disabled={
//                     loading || !passwordValidation.valid || !passwordsMatch
//                   }
//                   className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   {loading ? (
//                     <div className="flex items-center space-x-2">
//                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
//                       <span>Resetting password...</span>
//                     </div>
//                   ) : (
//                     "Reset Password"
//                   )}
//                 </button>
//               </form>
//             )}

//             {/* Back to Sign In Link */}
//             <div className="text-center pt-4 border-t border-border">
//               <span className="text-sm text-muted-foreground">
//                 Remember your password?{" "}
//                 <Link
//                   href="/auth/signin"
//                   className="text-primary hover:text-primary/80 hover:underline transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
//                 >
//                   Sign in here
//                 </Link>
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
