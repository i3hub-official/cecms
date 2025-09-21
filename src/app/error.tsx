// app/error.tsx (if you want to handle 429 specifically)
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; statusCode?: number };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  if (error.statusCode === 429) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              429 - Too Many Requests
            </h1>
            <p className="text-muted-foreground mb-6">
              You&apos;ve made too many requests. Please wait a moment and try
              again.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </button>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Home className="h-5 w-5" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default error handling for other errors
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Something went wrong!
        </h2>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
