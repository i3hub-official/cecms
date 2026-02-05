// app/too-many-requests.tsx
import Link from 'next/link';
import { Clock, RefreshCw, Home } from 'lucide-react';

export default function TooManyRequests() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-12 w-12" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">429 - Too Many Requests</h1>
          <p className="text-muted-foreground mb-6">
            You&apos;ve made too many requests in a short period. Please wait a moment and try again.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
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

        <div className="mt-8 text-sm text-muted-foreground">
          <p>If this error persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
}
