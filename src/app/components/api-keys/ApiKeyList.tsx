"use client";
// src/app/components/api-keys/ApiKeyList.tsx
import { ApiKey } from "@/types/api-keys";
import { useState } from "react";

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  onEdit: (apiKey: ApiKey) => void;
  onRevoke: (apiKeyId: string) => void;
  revokingId: string | null;
}

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
  if (key.revokedAt) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  if (isExpired(key.expiresAt)) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  if (key.isActive) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  return "bg-muted text-muted-foreground";
};

// Constants
const TABLE_HEADERS = [
  "Name & Details",
  "Key",
  "Permissions",
  "Usage",
  "Status",
  "Actions"
] as const;

const PERMISSION_CONFIGS = [
  { key: 'canRead' as const, label: 'Read', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { key: 'canWrite' as const, label: 'Write', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'canDelete' as const, label: 'Delete', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
];

// Sub-components
const EmptyState = () => (
  <div className="bg-card rounded-xl shadow-lg border">
    <div className="text-center py-12 px-6">
      <div className="text-muted-foreground text-6xl mb-4">🔑</div>
      <p className="text-foreground text-lg font-medium">No API keys found</p>
      <p className="text-sm text-muted-foreground mt-2">
        Create your first API key to get started
      </p>
    </div>
  </div>
);

const PermissionBadges = ({ apiKey }: { apiKey: ApiKey }) => {
  const hasPermissions = PERMISSION_CONFIGS.some(p => apiKey[p.key]);

  if (!hasPermissions) {
    return (
      <span className="inline-flex px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full font-medium">
        No Permissions
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {PERMISSION_CONFIGS.map(permission => (
        apiKey[permission.key] && (
          <span
            key={permission.key}
            className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${permission.className}`}
          >
            {permission.label}
          </span>
        )
      ))}
    </div>
  );
};

const StatusBadge = ({ apiKey }: { apiKey: ApiKey }) => (
  <span
    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClassName(apiKey)}`}
  >
    {getStatusText(apiKey)}
  </span>
);

// Mobile Card Component
const MobileApiKeyCard = ({ 
  apiKey, 
  onEdit, 
  onRevoke, 
  isRevoking 
}: {
  apiKey: ApiKey;
  onEdit: (apiKey: ApiKey) => void;
  onRevoke: (apiKeyId: string) => void;
  isRevoking: boolean;
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {apiKey.name}
            </h3>
            {apiKey.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {apiKey.description}
              </p>
            )}
          </div>
          <div className="ml-3 flex-shrink-0">
            <StatusBadge apiKey={apiKey} />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-4">
        {/* API Key Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              API Key
            </span>
            <span className="text-sm font-mono text-foreground">
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
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Permissions
          </div>
          <PermissionBadges apiKey={apiKey} />
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Requests
            </div>
            <div className="text-lg font-semibold text-foreground">
              {apiKey.usageCount || 0}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last Used
            </div>
            <div className="text-sm text-foreground">
              {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : 'Never'}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          Created: {formatDate(apiKey.createdAt)}
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={() => setShowActions(!showActions)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors touch-manipulation"
        >
          Actions
          <svg 
            className={`w-4 h-4 transition-transform ${showActions ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showActions && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onEdit(apiKey);
                setShowActions(false);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg font-medium transition-colors touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => {
                onRevoke(apiKey.id);
                setShowActions(false);
              }}
              disabled={isRevoking}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg font-medium transition-colors touch-manipulation disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
  <thead className="bg-muted/50">
    <tr>
      {TABLE_HEADERS.map((header) => (
        <th
          key={header}
          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
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
  isRevoking 
}: {
  apiKey: ApiKey;
  onEdit: (apiKey: ApiKey) => void;
  onRevoke: (apiKeyId: string) => void;
  isRevoking: boolean;
}) => (
  <tr className="hover:bg-muted/30 transition-colors">
    {/* Name & Details */}
    <td className="px-6 py-4">
      <div>
        <div className="text-sm font-medium text-foreground">
          {apiKey.name}
        </div>
        {apiKey.description && (
          <div className="text-sm text-muted-foreground mt-1">
            {apiKey.description}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          Created: {formatDate(apiKey.createdAt)}
        </div>
        {apiKey.lastUsed && (
          <div className="text-xs text-muted-foreground">
            Last used: {formatDate(apiKey.lastUsed)}
          </div>
        )}
      </div>
    </td>

    {/* Key */}
    <td className="px-6 py-4">
      <div className="text-sm font-mono text-foreground">
        {apiKey.prefix}...
      </div>
      <div className="text-xs text-muted-foreground">
        Expires: {formatDate(apiKey.expiresAt)}
      </div>
    </td>

    {/* Permissions */}
    <td className="px-6 py-4">
      <PermissionBadges apiKey={apiKey} />
    </td>

    {/* Usage */}
    <td className="px-6 py-4">
      <div className="text-sm font-medium text-foreground">
        {apiKey.usageCount || 0} requests
      </div>
      {apiKey.lastUsed && (
        <div className="text-xs text-muted-foreground">
          Last used: {formatDate(apiKey.lastUsed)}
        </div>
      )}
    </td>

    {/* Status */}
    <td className="px-6 py-4">
      <StatusBadge apiKey={apiKey} />
    </td>

    {/* Actions */}
    <td className="px-6 py-4">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onEdit(apiKey)}
          className="text-primary hover:text-primary/80 hover:underline text-sm font-medium transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onRevoke(apiKey.id)}
          disabled={isRevoking}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:underline text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isRevoking ? "Revoking..." : "Revoke"}
        </button>
      </div>
    </td>
  </tr>
);

// Main component
export default function ApiKeyList({
  apiKeys,
  onEdit,
  onRevoke,
  revokingId,
}: ApiKeyListProps) {
  if (apiKeys.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm border px-6 py-4">
        <h2 className="text-xl font-semibold text-foreground">Your API Keys</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your API keys and their permissions
        </p>
      </div>

      {/* Mobile Cards - Hidden on desktop */}
      <div className="grid gap-4 md:hidden">
        {apiKeys.map((key) => (
          <MobileApiKeyCard
            key={key.id}
            apiKey={key}
            onEdit={onEdit}
            onRevoke={onRevoke}
            isRevoking={revokingId === key.id}
          />
        ))}
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader />
            <tbody className="bg-card divide-y divide-border">
              {apiKeys.map((key) => (
                <DesktopApiKeyRow
                  key={key.id}
                  apiKey={key}
                  onEdit={onEdit}
                  onRevoke={onRevoke}
                  isRevoking={revokingId === key.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}