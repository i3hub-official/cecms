// src/app/test-auth/page.tsx - UPDATED
"use client";

import { useState, useEffect } from "react";

// Define a type for the API response structure
type ApiResult = {
  status: number;
  data?: unknown;
  error?: string;
  endpoint: string;
  timestamp: string;
};

export default function TestAuthPage() {
  const [results, setResults] = useState<ApiResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [cspError, setCspError] = useState<string | null>(null);

  // Listen for CSP errors
  useEffect(() => {
    const handleSecurityPolicyViolation = (e: SecurityPolicyViolationEvent) => {
      console.error("CSP Violation:", e);
      setCspError(`CSP blocked: ${e.blockedURI} - Directive: ${e.violatedDirective}`);
    };

    // @ts-ignore - SecurityPolicyViolationEvent is not in TypeScript lib yet
    document.addEventListener('securitypolicyviolation', handleSecurityPolicyViolation);

    return () => {
      // @ts-ignore
      document.removeEventListener('securitypolicyviolation', handleSecurityPolicyViolation);
    };
  }, []);

  // Reusable fetch handler to prevent code duplication
  const testEndpoint = async (endpoint: string) => {
    setLoading(endpoint);
    setCspError(null);

    try {
      console.log(`Testing endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        credentials: "include", // Essential for cookies
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      // Handle cases where response is not JSON
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const result: ApiResult = {
        status: response.status,
        data,
        endpoint,
        timestamp: new Date().toISOString(),
      };

      setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      
      // Log to console for debugging
      console.log(`Result for ${endpoint}:`, result);
      
    } catch (error) {
      const result: ApiResult = {
        status: 0, // 0 indicates network error
        error: error instanceof Error ? error.message : String(error),
        endpoint,
        timestamp: new Date().toISOString(),
      };
      
      setResults(prev => [result, ...prev.slice(0, 9)]);
      console.error(`Error testing ${endpoint}:`, error);
    } finally {
      setLoading(null);
    }
  };

  const testAllEndpoints = async () => {
    const endpoints = [
      "/api/auth/user",
      "/api/auth/me", 
      "/api/test-cookie",
      "/api/test-headers",
      "/api/health",
    ];
    
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const clearResults = () => {
    setResults([]);
    setCspError(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth & CSP Test Page</h1>
      
      {cspError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>CSP Error:</strong> {cspError}
        </div>
      )}
      
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-bold mb-2">Current Environment:</h2>
        <p>URL: {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}</p>
        <p>Running on: {typeof window !== 'undefined' ? window.location.hostname : 'Loading...'}</p>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => testEndpoint("/api/auth/user")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!!loading}
        >
          Test /api/auth/user
        </button>
        
        <button
          onClick={() => testEndpoint("/api/auth/me")}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!!loading}
        >
          Test /api/auth/me
        </button>
        
        <button
          onClick={() => testEndpoint("/api/test-cookie")}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!!loading}
        >
          Test Cookies
        </button>
        
        <button
          onClick={() => testEndpoint("/api/test-headers")}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!!loading}
        >
          Test Headers
        </button>
        
        <button
          onClick={testAllEndpoints}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!!loading}
        >
          Test All Endpoints
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
        >
          Clear Results
        </button>
      </div>

      {loading && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-600 font-semibold">
              Testing {loading}...
            </span>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Test Results (Newest First)</h2>
        
        {results.length === 0 ? (
          <div className="text-gray-500 italic">No tests run yet. Click a button above to start testing.</div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div 
                key={`${result.endpoint}-${result.timestamp}-${index}`}
                className={`p-4 rounded border ${
                  result.status === 200 
                    ? 'bg-green-50 border-green-200' 
                    : result.status === 401 || result.status === 403
                    ? 'bg-yellow-50 border-yellow-200'
                    : result.status === 0 || result.status >= 500
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold">{result.endpoint}</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      result.status === 200 ? 'bg-green-200 text-green-800' :
                      result.status === 401 ? 'bg-yellow-200 text-yellow-800' :
                      result.status === 404 ? 'bg-gray-200 text-gray-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      Status: {result.status || 'Network Error'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="mt-2">
                  {result.error ? (
                    <div className="text-red-600 font-mono text-sm">
                      Error: {result.error}
                    </div>
                  ) : (
                    <pre className="bg-white dark:bg-gray-900 p-3 rounded overflow-auto max-h-64 text-sm">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-bold mb-2">Debugging Tips:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Check browser DevTools → Console for CSP errors</li>
          <li>Check Network tab to see request/response headers</li>
          <li>Check Application → Cookies to see if auth-token is set</li>
          <li>Make sure you're signed in before testing auth endpoints</li>
          <li>If CSP blocks requests, check your middleware CSP configuration</li>
        </ul>
      </div>
    </div>
  );
}