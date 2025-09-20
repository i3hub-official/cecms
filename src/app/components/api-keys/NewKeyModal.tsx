"use client";
// src/app/components/api-keys/NewKeyModal.tsx
import { Copy, XCircle, Check, Download, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";

interface NewKeyModalProps {
  newKey: {
    apiKey: string;
    name: string;
    prefix: string;
    id?: string;
    expiresAt?: string;
    createdAt?: string;
  };
  onClose: () => void;
  onCopy: () => void;
}

export default function NewKeyModal({
  newKey,
  onClose,
  onCopy,
}: NewKeyModalProps) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Auto-close timer (optional security feature)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newKey.apiKey);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = newKey.apiKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const keyData = {
      name: newKey.name,
      apiKey: newKey.apiKey,
      prefix: newKey.prefix,
      id: newKey.id,
      createdAt: newKey.createdAt || new Date().toISOString(),
      expiresAt: newKey.expiresAt,
      warning: "Keep this API key secure and never share it publicly",
    };

    const blob = new Blob([JSON.stringify(keyData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-key-${newKey.name
      .replace(/\s+/g, "-")
      .toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (acknowledged) {
      onClose();
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return (
      key.substring(0, 4) +
      "•".repeat(Math.max(12, key.length - 8)) +
      key.substring(key.length - 4)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border rounded-xl shadow-xl max-w-lg w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m0 0a2 2 0 01-2 2m2-2H9m12 0V9a2 2 0 00-2-2M3 11a2 2 0 012-2m0 0a2 2 0 012 2m-2 0a2 2 0 01-2 2m0 0a2 2 0 002 2M3 15a2 2 0 012-2m0 0h2m-2 0a2 2 0 01-2-2m2-2v2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">
                API Key Generated Successfully!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your API key &qout;<span className="font-medium">{newKey.name}</span>
                &qout; is ready to use
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Security Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Important Security Notice
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This is the only time you&apos;ll see the complete API key. Store
                  it securely and never share it publicly.
                </p>
              </div>
            </div>
          </div>

          {/* API Key Display */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Your API Key
              </label>
              <button
                onClick={() => setShowKey(!showKey)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    Show
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <div className="bg-muted border rounded-lg p-4">
                <div className="font-mono text-sm break-all text-foreground select-all">
                  {showKey ? newKey.apiKey : maskKey(newKey.apiKey)}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Prefix: <span className="font-mono">{newKey.prefix}</span>
                  </span>
                  {newKey.id && (
                    <span className="text-xs text-muted-foreground">
                      ID:{" "}
                      <span className="font-mono">
                        {newKey.id.substring(0, 8)}...
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              disabled={copied}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Key
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          {/* Key Information */}
          {(newKey.createdAt || newKey.expiresAt) && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium text-foreground">
                Key Details
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                {newKey.createdAt && (
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(newKey.createdAt).toLocaleString()}</span>
                  </div>
                )}
                {newKey.expiresAt && (
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span>{new Date(newKey.expiresAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acknowledgment Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-border focus:ring-primary focus:ring-2 mt-1"
            />
            <span className="text-sm text-muted-foreground flex-1">
              I understand that this is the only time I can view this API key,
              and I have safely stored it in a secure location.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Keep your API key secure
            </div>

            <button
              onClick={handleClose}
              disabled={!acknowledged}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              I&apos;m Done
            </button>
          </div>
        </div>

        {/* Auto-close warning (optional) */}
        {timeLeft > 0 && timeLeft <= 10 && (
          <div className="absolute top-2 right-2">
            <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-xs font-medium">
              Auto-closing in {timeLeft}s
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
