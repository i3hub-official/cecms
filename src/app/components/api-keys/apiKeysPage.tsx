// src/app/components/api-keys/ApiKeyPage.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ApiKeysHeader from "./ApiKeysHeader";
import ApiKeysTabs from "./ApiKeysTabs";
import ApiKeysCreate from "./ApiKeysCreate";
import ApiKeysManage from "./ApiKeysManage";
import Alert from "../ui/Alert";
import { ApiKey, NewApiKeyResponse } from "@/types/api-keys";

export default function ApiKeyPage() {
  const router = useRouter();

  // State management
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<NewApiKeyResponse | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch("/api/auth/validate", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        setIsAuthenticated(true);
        fetchApiKeys();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
        router.push("/auth/signin");
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      setIsAuthenticated(false);
      setLoading(false);
      router.push("/auth/signin");
    }
  };

  // Fetch API keys
  const fetchApiKeys = async () => {
    try {
      setError(null);
      const response = await fetch("/apis/v1/user/api-key", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          router.push("/auth/signin");
          return;
        }
        // Handle 404 as empty array (no API keys yet)
        if (response.status === 404) {
          setApiKeys([]);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setApiKeys(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      // Don't show error for 404 - it's expected when no keys exist
      if (error instanceof Error && !error.message.includes("404")) {
        setError("Failed to fetch API keys. Please try again.");
      }
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handle new key display
  useEffect(() => {
    if (newKey && showNewKey) {
      const timer = setTimeout(() => {
        setShowNewKey(false);
        setNewKey(null);
      }, 10000); // Hide after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [newKey, showNewKey]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setSuccess("Copied to clipboard!");
    }
  };

  // if (loading) {
  //   return (
  //     <div className="max-w-7xl mx-auto p-6 bg-background">
  //       <div className="flex items-center justify-center py-12">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  //         <div className="ml-3 text-lg text-foreground">
  //           Loading API keys...
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-background">
        <div className="bg-card border border-border rounded-lg p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Authentication Required
          </h2>
          <p className="text-foreground/70">
            Please log in to manage your API keys.
          </p>
          <button
            onClick={() => router.push("/auth/signin")}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-background text-foreground">
      <ApiKeysHeader />

      {/* Alert Messages */}
      {error && (
        <Alert type="error" message={error} onDismiss={() => setError(null)} />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}

      {/* New API Key Display */}
      {showNewKey && newKey && (
        <Alert
          type="success"
          title="New API Key Created!"
          message={
            <div className="space-y-3">
              <p>
                Your new API key has been generated. Make sure to copy it now –
                you won&apos;t be able to see it again!
              </p>
              <div className="bg-card border border-border p-3 rounded-md font-mono text-sm break-all text-foreground shadow-sm">
                {newKey.apiKey}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copyToClipboard(newKey.apiKey)}
                  className="bg-primary text-white px-3 py-1 rounded text-sm hover:opacity-90 transition-opacity focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  Copy API Key
                </button>
                <button
                  onClick={() => {
                    setShowNewKey(false);
                    setNewKey(null);
                  }}
                  className="bg-background border border-border text-foreground px-3 py-1 rounded text-sm hover:bg-card transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  Close
                </button>
              </div>
            </div>
          }
          dismissible={false}
        />
      )}

      <ApiKeysTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        keyCount={apiKeys.length}
      />

      {activeTab === "create" && (
        <ApiKeysCreate
          onCreateSuccess={(newKeyData: NewApiKeyResponse) => {
            setNewKey(newKeyData);
            setShowNewKey(true);
            setSuccess("API key created successfully!");
            setActiveTab("manage");
            fetchApiKeys();
          }}
          onError={setError}
        />
      )}

      {activeTab === "manage" && (
        <ApiKeysManage
          apiKeys={apiKeys}
          onRefresh={fetchApiKeys}
          onError={setError}
          onSuccess={setSuccess}
        />
      )}
    </div>
  );
}
