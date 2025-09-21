// src/app/components/api-keys/ApiKeyPage.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Key,
  Clock,
} from "lucide-react";
import ApiKeysHeader from "./ApiKeysHeader";
import ApiKeysTabs from "./ApiKeysTabs";
import ApiKeysCreate from "./ApiKeysCreate";
import ApiKeysManage from "./ApiKeysManage";
import Alert from "../ui/Alert";
import { notifySuccess, notifyError } from "@/app/components/ui/notifications";
import {
  ApiKey,
  NewApiKeyResponse,
  ApiKeysManageProps,
} from "@/types/api-keys";

// Enhanced Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-background border border-border rounded-2xl ${maxWidth} w-full mx-4 shadow-2xl transform transition-all duration-200 scale-100`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  isDestructive?: boolean;
  loading?: boolean;
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  isDestructive = false,
  loading = false,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start">
          {isDestructive ? (
            <AlertTriangle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-5 py-2.5 text-sm font-medium rounded-lg border border-border bg-background hover:bg-accent transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 ${
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            } shadow-md hover:shadow-lg`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {isDestructive ? (
                  <RefreshCw className="h-4 w-4 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {confirmText}
              </div>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// API Key Display Modal Component
interface ApiKeyDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  isRegenerated?: boolean;
  onCopy: (text: string) => void;
  timeLeft: number;
}

const ApiKeyDisplayModal = ({
  isOpen,
  onClose,
  apiKey,
  isRegenerated = false,
  onCopy,
  timeLeft,
}: ApiKeyDisplayModalProps) => {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegenerated ? "API Key Regenerated!" : "New API Key Created!"}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <Key className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground leading-relaxed mb-4">
              {isRegenerated
                ? "Your API key has been regenerated successfully. The old key is now invalid."
                : "Your new API key has been generated successfully."}{" "}
              Make sure to copy it now – you won&apos;t be able to see it again!
            </p>

            <div className="bg-muted/30 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  API Key
                </span>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Auto-close in {formatTime(timeLeft)}
                </div>
              </div>
              <code className="text-sm break-all font-mono bg-background p-2 rounded border block">
                {apiKey}
              </code>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-2.5 text-sm font-medium rounded-lg border border-border bg-background hover:bg-accent transition-all duration-200"
          >
            Close
          </button>
          <button
            onClick={() => onCopy(apiKey)}
            className="flex-1 px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy API Key
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default function ApiKeyPage() {
  const router = useRouter();

  // State management
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerateLoading, setRegenerateLoading] = useState<string | null>(
    null
  );
  const [newKey, setNewKey] = useState<NewApiKeyResponse | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
    action: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    isDestructive: false,
    action: () => {},
  });

  // Timer ref for auto-close
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

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
      if (error instanceof Error && !error.message.includes("404")) {
        setError("Failed to fetch API keys. Please try again.");
      }
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle regenerate API key
  const handleRegenerateApiKey = async (keyId: string) => {
    setRegenerateLoading(keyId);
    try {
      const response = await fetch(
        `/apis/v1/user/api-key/${keyId}/regenerate`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (data.success) {
        setNewKey({
          apiKey: data.data.key,
          keyId: keyId,
          isRegenerated: true,
          id: data.data.id,
          name: data.data.name,
          prefix: data.data.prefix,
          expiresAt: data.data.expiresAt,
          createdAt: data.data.createdAt,
        });
        setShowNewKey(true);
        setTimeLeft(30); // Reset timer
        startAutoCloseTimer();
        notifySuccess("API key regenerated successfully!");
        fetchApiKeys();
      } else {
        notifyError(data.error || "Failed to regenerate API key");
      }
    } catch (error) {
      notifyError("Failed to regenerate API key");
    } finally {
      setRegenerateLoading(null);
    }
  };

  // Start auto-close timer for modal
  const startAutoCloseTimer = () => {
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Start countdown
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-close after 30 seconds
    timerRef.current = setTimeout(() => {
      setShowNewKey(false);
      setNewKey(null);
      setTimeLeft(30);
    }, 30000);
  };

  // Handle success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handle new key display timer
  useEffect(() => {
    if (newKey && showNewKey) {
      startAutoCloseTimer();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [newKey, showNewKey]);

  // Auto-close when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && showNewKey) {
      setShowNewKey(false);
      setNewKey(null);
      setTimeLeft(30);
    }
  }, [timeLeft, showNewKey]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notifySuccess("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      notifySuccess("Copied to clipboard!");
    }
  };

  const openConfirmModal = (
    title: string,
    message: string,
    confirmText: string,
    isDestructive: boolean,
    action: () => void
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      isDestructive,
      action,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmAction = () => {
    confirmModal.action();
    closeConfirmModal();
  };

  const handleCloseKeyModal = () => {
    setShowNewKey(false);
    setNewKey(null);
    setTimeLeft(30);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

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

      <ApiKeysTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        keyCount={apiKeys.length}
      />

      {activeTab === "create" && (
        <ApiKeysCreate
          onCreateSuccess={(newKeyData: NewApiKeyResponse) => {
            const { id, apiKey, keyId, name, prefix, expiresAt, createdAt } =
              newKeyData;
            setNewKey(newKeyData);
            setShowNewKey(true);
            setTimeLeft(30);
            notifySuccess("API key created successfully!");
            setActiveTab("manage");
            fetchApiKeys();
          }}
          onError={(error) => {
            setError(error);
            notifyError(error);
          }}
        />
      )}

      {activeTab === "manage" && (
        <ApiKeysManage
          apiKeys={apiKeys}
          onRefresh={fetchApiKeys}
          onError={(error) => {
            setError(error);
            notifyError(error);
          }}
          onSuccess={(message) => {
            setSuccess(message);
            notifySuccess(message);
          }}
          onRegenerate={(keyId: string) =>
            openConfirmModal(
              "Regenerate API Key",
              "Are you sure you want to regenerate this API key? The old key will stop working immediately and cannot be recovered.",
              "Regenerate Key",
              true,
              () => handleRegenerateApiKey(keyId)
            )
          }
          regenerateLoading={regenerateLoading}
        />
      )}

      {/* API Key Display Modal */}
      {newKey && (
        <ApiKeyDisplayModal
          isOpen={showNewKey}
          onClose={handleCloseKeyModal}
          apiKey={newKey.apiKey}
          isRegenerated={newKey.isRegenerated || false}
          onCopy={copyToClipboard}
          timeLeft={timeLeft}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
        loading={regenerateLoading !== null}
      />
    </div>
  );
}

// // src/app/components/api-keys/ApiKeyPage.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import ApiKeysHeader from "./ApiKeysHeader";
// import ApiKeysTabs from "./ApiKeysTabs";
// import ApiKeysCreate from "./ApiKeysCreate";
// import ApiKeysManage from "./ApiKeysManage";
// import Alert from "../ui/Alert";
// import { ApiKey, NewApiKeyResponse } from "@/types/api-keys";

// export default function ApiKeyPage() {
//   const router = useRouter();

//   // State management
//   const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [newKey, setNewKey] = useState<NewApiKeyResponse | null>(null);
//   const [showNewKey, setShowNewKey] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   // Check authentication
//   useEffect(() => {
//     checkAuthentication();
//   }, []);

//   const checkAuthentication = async () => {
//     try {
//       const response = await fetch("/api/auth/validate", {
//         method: "GET",
//         credentials: "include",
//       });

//       if (response.ok) {
//         setIsAuthenticated(true);
//         fetchApiKeys();
//       } else {
//         setIsAuthenticated(false);
//         setLoading(false);
//         router.push("/auth/signin");
//       }
//     } catch (error) {
//       console.error("Authentication check failed:", error);
//       setIsAuthenticated(false);
//       setLoading(false);
//       router.push("/auth/signin");
//     }
//   };

//   // Fetch API keys
//   const fetchApiKeys = async () => {
//     try {
//       setError(null);
//       const response = await fetch("/apis/v1/user/api-key", {
//         credentials: "include",
//       });

//       if (!response.ok) {
//         if (response.status === 401) {
//           setIsAuthenticated(false);
//           router.push("/auth/signin");
//           return;
//         }
//         // Handle 404 as empty array (no API keys yet)
//         if (response.status === 404) {
//           setApiKeys([]);
//           setLoading(false);
//           return;
//         }
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       setApiKeys(Array.isArray(data.data) ? data.data : []);
//     } catch (error) {
//       console.error("Failed to fetch API keys:", error);
//       // Don't show error for 404 - it's expected when no keys exist
//       if (error instanceof Error && !error.message.includes("404")) {
//         setError("Failed to fetch API keys. Please try again.");
//       }
//       setApiKeys([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle success messages
//   useEffect(() => {
//     if (success) {
//       const timer = setTimeout(() => setSuccess(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [success]);

//   // Handle new key display
//   useEffect(() => {
//     if (newKey && showNewKey) {
//       const timer = setTimeout(() => {
//         setShowNewKey(false);
//         setNewKey(null);
//       }, 10000); // Hide after 10 seconds
//       return () => clearTimeout(timer);
//     }
//   }, [newKey, showNewKey]);

//   const copyToClipboard = async (text: string) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       setSuccess("Copied to clipboard!");
//     } catch (error) {
//       console.error("Failed to copy to clipboard:", error);
//       // Fallback for older browsers
//       const textArea = document.createElement("textarea");
//       textArea.value = text;
//       document.body.appendChild(textArea);
//       textArea.select();
//       document.execCommand("copy");
//       document.body.removeChild(textArea);
//       setSuccess("Copied to clipboard!");
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto p-6 bg-background text-foreground">
//       <ApiKeysHeader />

//       {/* Alert Messages */}
//       {error && (
//         <Alert type="error" message={error} onDismiss={() => setError(null)} />
//       )}
//       {success && (
//         <Alert
//           type="success"
//           message={success}
//           onDismiss={() => setSuccess(null)}
//         />
//       )}

//       {/* New API Key Display */}
//       {showNewKey && newKey && (
//         <Alert
//           type="success"
//           title="New API Key Created!"
//           message={
//             <div className="space-y-3">
//               <p>
//                 Your new API key has been generated. Make sure to copy it now –
//                 you won&apos;t be able to see it again!
//               </p>
//               <div className="bg-card border border-border p-3 rounded-md font-mono text-sm break-all text-foreground shadow-sm">
//                 {newKey.apiKey}
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 <button
//                   onClick={() => copyToClipboard(newKey.apiKey)}
//                   className="bg-primary text-white px-3 py-1 rounded text-sm hover:opacity-90 transition-opacity focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
//                 >
//                   Copy API Key
//                 </button>
//                 <button
//                   onClick={() => {
//                     setShowNewKey(false);
//                     setNewKey(null);
//                   }}
//                   className="bg-background border border-border text-foreground px-3 py-1 rounded text-sm hover:bg-card transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           }
//           dismissible={false}
//         />
//       )}

//       <ApiKeysTabs
//         activeTab={activeTab}
//         onTabChange={setActiveTab}
//         keyCount={apiKeys.length}
//       />

//       {activeTab === "create" && (
//         <ApiKeysCreate
//           onCreateSuccess={(newKeyData: NewApiKeyResponse) => {
//             setNewKey(newKeyData);
//             setShowNewKey(true);
//             setSuccess("API key created successfully!");
//             setActiveTab("manage");
//             fetchApiKeys();
//           }}
//           onError={setError}
//         />
//       )}

//       {activeTab === "manage" && (
//         <ApiKeysManage
//           apiKeys={apiKeys}
//           onRefresh={fetchApiKeys}
//           onError={setError}
//           onSuccess={setSuccess}
//         />
//       )}
//     </div>
//   );
// }
