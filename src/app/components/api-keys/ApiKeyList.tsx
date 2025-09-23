"use client";
// src/app/components/api-keys/ApiKeyList.tsx

import { ApiKey, ApiKeyListProps } from "@/types/api-keys";
import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

// Utility functions
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
};

const isExpired = (dateString: string): boolean => {
  try {
    return new Date(dateString) < new Date();
  } catch {
    return false;
  }
};

const getStatusText = (key: ApiKey): string => {
  if (key.revokedAt) return "Revoked";
  if (isExpired(key.expiresAt)) return "Expired";
  if (key.isActive) return "Active";
  return "Inactive";
};

const getStatusClassName = (key: ApiKey): string => {
  if (key.revokedAt)
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  if (isExpired(key.expiresAt))
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  if (key.isActive)
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  return "bg-muted text-muted-foreground";
};

// Constants
const TABLE_HEADERS = [
  "Name & Details",
  "Key",
  "Permissions",
  "Usage",
  "Status",
  "Actions",
] as const;

const PERMISSION_CONFIGS = [
  {
    key: "canRead" as const,
    label: "Read",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    key: "canWrite" as const,
    label: "Write",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    key: "canDelete" as const,
    label: "Delete",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-background rounded-3xl ${maxWidth} w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100 animate-in zoom-in-95`}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-accent/50 rounded-full transition-all duration-200 hover:scale-110"
          >
            <svg
              className="h-5 w-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  apiKeyName,
  isLoading,
  action,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  apiKeyName: string;
  isLoading: boolean;
  action: "revoke" | "regenerate";
}) => {
  const isDestructive = action === "revoke";
  const title = action === "revoke" ? "Revoke API Key" : "Regenerate API Key";
  const confirmText = action === "revoke" ? "Revoke Key" : "Regenerate Key";
  const loadingText = action === "revoke" ? "Revoking..." : "Regenerating...";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="flex items-start">
          {isDestructive ? (
            <AlertTriangle className="h-5 w-5 text-destructive mr-4 mt-0.5 flex-shrink-0" />
          ) : (
            <RefreshCw className="h-5 w-5 text-primary mr-4 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-muted-foreground leading-relaxed mb-5">
              Are you sure you want to {action} the API key{" "}
              <span className="font-semibold text-foreground">
                &quot;{apiKeyName}&quot;
              </span>
              ?
            </p>

            <div
              className={`rounded-xl p-4 ${
                isDestructive
                  ? "bg-red-50 dark:bg-red-900/20"
                  : "bg-blue-50 dark:bg-blue-900/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <svg
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    isDestructive ? "text-red-500" : "text-blue-500"
                  }`}
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
                <div
                  className={`text-xs ${
                    isDestructive
                      ? "text-red-700 dark:text-red-400"
                      : "text-blue-700 dark:text-blue-400"
                  }`}
                >
                  <p className="font-medium mb-2">
                    {action === "revoke"
                      ? "This will immediately:"
                      : "This will:"}
                  </p>
                  <ul className="space-y-1">
                    {action === "revoke" ? (
                      <>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-current"></div>
                          Disable all API access for this key
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-current"></div>
                          Stop any active requests using this key
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-current"></div>
                          Make the key permanently unusable
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-current"></div>
                          Generate a new API key
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-current"></div>
                          Invalidate the current key immediately
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-current"></div>
                          Show you the new key (copy it immediately!)
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 text-sm font-medium rounded-xl bg-background hover:bg-accent transition-all duration-200 disabled:opacity-50 hover:scale-[0.98] active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-[0.98] active:scale-95 ${
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            } shadow-lg hover:shadow-xl`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                {loadingText}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {isDestructive ? (
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
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

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  startItem,
  endItem,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  startItem: number;
  endItem: number;
}) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="bg-card rounded-2xl shadow-sm">
      {/* Mobile Pagination */}
      <div className="md:hidden px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {startItem}-{endItem} of {totalItems}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-3 rounded-xl hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation hover:scale-105 active:scale-95"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-sm font-medium px-4">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-3 rounded-xl hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation hover:scale-105 active:scale-95"
            >
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Pagination */}
      <div className="hidden md:flex items-center justify-between px-8 py-5">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{startItem}</span> to{" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalItems}</span> API keys
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-1 mx-3">
            {getVisiblePages().map((page, index) => (
              <div key={index}>
                {page === "..." ? (
                  <span className="px-4 py-2.5 text-sm text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {page}
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            Next
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const EmptyState = () => (
  <div className="bg-card rounded-2xl shadow-lg">
    <div className="text-center py-16 px-8">
      <div className="text-muted-foreground text-6xl mb-6 animate-pulse">
        🔑
      </div>
      <p className="text-foreground text-xl font-medium mb-3">
        No API keys found
      </p>
      <p className="text-sm text-muted-foreground">
        Create your first API key to get started
      </p>
    </div>
  </div>
);

const PermissionBadges = ({ apiKey }: { apiKey: ApiKey }) => {
  const hasPermissions = PERMISSION_CONFIGS.some((p) => apiKey[p.key]);

  if (!hasPermissions) {
    return (
      <span className="inline-flex px-3 py-1.5 bg-muted text-muted-foreground text-xs rounded-full font-medium">
        No Permissions
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {PERMISSION_CONFIGS.map(
        (permission) =>
          apiKey[permission.key] && (
            <span
              key={permission.key}
              className={`inline-flex px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-200 hover:scale-105 ${permission.className}`}
            >
              {permission.label}
            </span>
          )
      )}
    </div>
  );
};

const StatusBadge = ({ apiKey }: { apiKey: ApiKey }) => (
  <span
    className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 hover:scale-105 ${getStatusClassName(
      apiKey
    )}`}
  >
    {getStatusText(apiKey)}
  </span>
);

// Mobile Card Component
const MobileApiKeyCard = ({
  apiKey,
  onEdit,
  onRevoke,
  onRegenerate,
  isRevoking,
  isRegenerating,
}: {
  apiKey: ApiKey;
  onEdit: (apiKey: ApiKey) => void;
  onRevoke: (apiKeyId: string, keyName: string) => void;
  onRegenerate: (apiKeyId: string, keyName: string) => void;
  isRevoking: boolean;
  isRegenerating: boolean;
}) => {
  const [showActions, setShowActions] = useState(false);
  const canRegenerate =
    apiKey.isActive && !apiKey.revokedAt && !isExpired(apiKey.expiresAt);

  return (
    <div className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group">
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
              {apiKey.name}
            </h3>
            {apiKey.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {apiKey.description}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <StatusBadge apiKey={apiKey} />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="px-6 pb-6 space-y-5">
        {/* API Key Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              API Key
            </span>
            <span className="text-sm font-mono text-foreground bg-muted/50 px-3 py-1 rounded-lg">
              {apiKey.prefix}...
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Expires
            </span>
            <span className="text-sm text-foreground">
              {formatDate(apiKey.expiresAt)}
            </span>
          </div>
        </div>

        {/* Permissions */}
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Permissions
          </div>
          <PermissionBadges apiKey={apiKey} />
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-6 pt-4 bg-muted/20 rounded-xl p-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Requests
            </div>
            <div className="text-lg font-semibold text-foreground">
              {apiKey.usageCount || 0}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Last Used
            </div>
            <div className="text-sm text-foreground">
              {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : "Never"}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground pt-2">
          Created: {formatDate(apiKey.createdAt)}
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6 pt-0">
        <button
          onClick={() => setShowActions(!showActions)}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-medium transition-all duration-200 touch-manipulation hover:scale-[0.98] active:scale-95"
        >
          Actions
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              showActions ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showActions && (
          <div className="mt-4 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => {
                onEdit(apiKey);
                setShowActions(false);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-xl font-medium transition-all duration-200 touch-manipulation hover:scale-[0.98] active:scale-95"
            >
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>

            {canRegenerate && (
              <button
                onClick={() => {
                  onRegenerate(apiKey.id, apiKey.name);
                  setShowActions(false);
                }}
                disabled={isRegenerating}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-xl font-medium transition-all duration-200 touch-manipulation disabled:opacity-50 hover:scale-[0.98] active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                {isRegenerating ? "Regenerating..." : "Regenerate"}
              </button>
            )}

            <button
              onClick={() => {
                onRevoke(apiKey.id, apiKey.name);
                setShowActions(false);
              }}
              disabled={isRevoking}
              className={`flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-xl font-medium transition-all duration-200 touch-manipulation disabled:opacity-50 hover:scale-[0.98] active:scale-95 ${
                canRegenerate ? "col-span-2" : ""
              }`}
            >
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {isRevoking ? "Revoking..." : "Revoke"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Desktop Table Components
const TableHeader = () => (
  <thead className="bg-muted/30">
    <tr>
      {TABLE_HEADERS.map((header) => (
        <th
          key={header}
          className="px-8 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          {header}
        </th>
      ))}
    </tr>
  </thead>
);

const DesktopApiKeyRow = ({
  apiKey,
  onEdit,
  onRevoke,
  onRegenerate,
  isRevoking,
  isRegenerating,
}: {
  apiKey: ApiKey;
  onEdit: (apiKey: ApiKey) => void;
  onRevoke: (apiKeyId: string, keyName: string) => void;
  onRegenerate: (apiKeyId: string, keyName: string) => void;
  isRevoking: boolean;
  isRegenerating: boolean;
}) => {
  const canRegenerate =
    apiKey.isActive && !apiKey.revokedAt && !isExpired(apiKey.expiresAt);

  return (
    <tr className="hover:bg-muted/20 transition-all duration-200 group">
      {/* Name & Details */}
      <td className="px-8 py-6">
        <div>
          <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
            {apiKey.name}
          </div>
          {apiKey.description && (
            <div className="text-sm text-muted-foreground mt-1.5">
              {apiKey.description}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
            <div>Created: {formatDate(apiKey.createdAt)}</div>
            {apiKey.lastUsed && (
              <div>Last used: {formatDate(apiKey.lastUsed)}</div>
            )}
          </div>
        </div>
      </td>

      {/* Key */}
      <td className="px-8 py-6">
        <div className="text-sm font-mono text-foreground bg-muted/50 px-3 py-1.5 rounded-lg inline-block">
          {apiKey.prefix}...
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Expires: {formatDate(apiKey.expiresAt)}
        </div>
      </td>

      {/* Permissions */}
      <td className="px-8 py-6">
        <PermissionBadges apiKey={apiKey} />
      </td>

      {/* Usage */}
      <td className="px-8 py-6">
        <div className="text-sm font-medium text-foreground">
          {apiKey.usageCount || 0} requests
        </div>
        {apiKey.lastUsed && (
          <div className="text-xs text-muted-foreground mt-1">
            Last used: {formatDate(apiKey.lastUsed)}
          </div>
        )}
      </td>

      {/* Status */}
      <td className="px-8 py-6">
        <StatusBadge apiKey={apiKey} />
      </td>

      {/* Actions */}
      <td className="px-8 py-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onEdit(apiKey)}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Edit
          </button>
          {canRegenerate && (
            <button
              onClick={() => onRegenerate(apiKey.id, apiKey.name)}
              disabled={isRegenerating}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-3 h-3" />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </button>
          )}
          <button
            onClick={() => onRevoke(apiKey.id, apiKey.name)}
            disabled={isRevoking}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
          >
            {isRevoking ? "Revoking..." : "Revoke"}
          </button>
        </div>
      </td>
    </tr>
  );
};

// Enhanced ApiKeyListProps interface
interface EnhancedApiKeyListProps extends Omit<ApiKeyListProps, "onRevoke"> {
  onRevoke: (apiKeyId: string) => void;
  onRegenerate?: (apiKeyId: string) => void;
  revokingId: string | null;
  regeneratingId: string | null;
}

// Main component
export default function ApiKeyList({
  apiKeys,
  onEdit,
  onRevoke,
  onRegenerate,
  revokingId,
  regeneratingId,
  itemsPerPage = 10,
}: EnhancedApiKeyListProps) {
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    apiKeyId: string;
    apiKeyName: string;
    action: "revoke" | "regenerate";
  }>({ isOpen: false, apiKeyId: "", apiKeyName: "", action: "revoke" });

  const [currentPage, setCurrentPage] = useState(1);

  // Pagination calculations
  const totalItems = apiKeys.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentApiKeys = apiKeys.slice(startIndex, endIndex);
  const startItem = totalItems > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, totalItems);

  // Reset to first page when apiKeys change
  useEffect(() => {
    setCurrentPage(1);
  }, [apiKeys.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top on page change for better UX
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRevokeClick = (apiKeyId: string, apiKeyName: string) => {
    setConfirmationModal({
      isOpen: true,
      apiKeyId,
      apiKeyName,
      action: "revoke",
    });
  };

  const handleRegenerateClick = (apiKeyId: string, apiKeyName: string) => {
    if (!onRegenerate) return;

    setConfirmationModal({
      isOpen: true,
      apiKeyId,
      apiKeyName,
      action: "regenerate",
    });
  };

  const handleConfirmAction = () => {
    const { action, apiKeyId } = confirmationModal;

    if (action === "revoke") {
      onRevoke(apiKeyId);
    } else if (action === "regenerate" && onRegenerate) {
      onRegenerate(apiKeyId);
    }

    setConfirmationModal({
      isOpen: false,
      apiKeyId: "",
      apiKeyName: "",
      action: "revoke",
    });
  };

  const handleCancelAction = () => {
    setConfirmationModal({
      isOpen: false,
      apiKeyId: "",
      apiKeyName: "",
      action: "revoke",
    });
  };

  if (totalItems === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="bg-card rounded-2xl shadow-sm px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Your API Keys
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Manage your API keys and their permissions
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>
                  {
                    apiKeys.filter(
                      (key) =>
                        key.isActive &&
                        !key.revokedAt &&
                        !isExpired(key.expiresAt)
                    ).length
                  }{" "}
                  Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-muted-foreground rounded-full"></div>
                <span>{totalItems} Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Cards - Hidden on desktop */}
        <div className="grid gap-6 md:hidden">
          {currentApiKeys.map((key, index) => (
            <div
              key={key.id}
              className="animate-in slide-in-from-bottom-4 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <MobileApiKeyCard
                apiKey={key}
                onEdit={onEdit}
                onRevoke={handleRevokeClick}
                onRegenerate={handleRegenerateClick}
                isRevoking={revokingId === key.id}
                isRegenerating={regeneratingId === key.id}
              />
            </div>
          ))}
        </div>

        {/* Desktop Table - Hidden on mobile */}
        <div className="hidden md:block bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHeader />
              <tbody className="bg-card divide-y divide-muted/30">
                {currentApiKeys.map((key, index) => (
                  <div
                    key={key.id}
                    className="animate-in slide-in-from-bottom-2 duration-200"
                    style={{ animationDelay: `${index * 25}ms` }}
                  >
                    <DesktopApiKeyRow
                      apiKey={key}
                      onEdit={onEdit}
                      onRevoke={handleRevokeClick}
                      onRegenerate={handleRegenerateClick}
                      isRevoking={revokingId === key.id}
                      isRegenerating={regeneratingId === key.id}
                    />
                  </div>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          startItem={startItem}
          endItem={endItem}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        apiKeyName={confirmationModal.apiKeyName}
        isLoading={
          confirmationModal.action === "revoke"
            ? revokingId === confirmationModal.apiKeyId
            : regeneratingId === confirmationModal.apiKeyId
        }
        action={confirmationModal.action}
      />
    </>
  );
}
