// src/app/components/api-keys/ApiKeysCreate.tsx
import { useState } from "react";
import { ApiKeyFormData } from "@/types/api-keys";

const ENDPOINT_OPTIONS = [
  {
    value: "*",
    label: "All Endpoints",
    description: "Access to all available API endpoints",
  },
  {
    value: "/apis/v1/center-lookup",
    label: "Center Lookup Only",
    description: "Only center lookup functionality",
  },
  {
    value: "/apis/v1/dispute-center/*",
    label: "Dispute Center Endpoints",
    description: "All dispute center related endpoints",
  },
  {
    value: "/apis/v1/helper/*",
    label: "Helper Endpoints",
    description: "Utility and helper endpoints",
  },
  {
    value: "/apis/v1/user/*",
    label: "User Management",
    description: "User profile and settings endpoints",
  },
  {
    value: "/apis/v1/reports/*",
    label: "Reports",
    description: "Reporting and analytics endpoints",
  },
];

const RATE_LIMIT_OPTIONS = [
  { value: 10, label: "10 requests/hour", tier: "Basic" },
  { value: 100, label: "100 requests/hour", tier: "Standard" },
  { value: 500, label: "500 requests/hour", tier: "Premium" },
  { value: 1000, label: "1000 requests/hour", tier: "Enterprise" },
];

interface ApiKeysCreateProps {
  onCreateSuccess: (newKey: {
    id: string;
    apiKey: string;
    name: string;
    prefix: string;
    expiresAt: string;
    createdAt: string;
  }) => void;
  onError: (error: string) => void;
}

export default function ApiKeysCreate({
  onCreateSuccess,
  onError,
}: ApiKeysCreateProps) {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<ApiKeyFormData>({
    name: "",
    description: "",
    canRead: true,
    canWrite: false,
    canDelete: false,
    allowedEndpoints: "*",
    rateLimit: 100,
    expiresInDays: 365,
  });

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      onError("Name is required");
      return;
    }

    if (!formData.canRead && !formData.canWrite && !formData.canDelete) {
      onError("At least one permission must be selected");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/apis/v1/user/api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      onCreateSuccess(data.data);

      // Reset form
      setFormData({
        name: "",
        description: "",
        canRead: true,
        canWrite: false,
        canDelete: false,
        allowedEndpoints: "*",
        rateLimit: 100,
        expiresInDays: 365,
      });
    } catch (error) {
      console.error("Failed to create API key:", error);
      onError(
        error instanceof Error ? error.message : "Failed to create API key"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Create New API Key
        </h2>
        <p className="text-muted-foreground">
          Generate a new API key with specific permissions and access controls.
        </p>
      </div>

      <form onSubmit={createApiKey} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-2"
            >
              API Key Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              placeholder="e.g., Production App, Mobile Client"
              maxLength={50}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Description
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              placeholder="Optional description of this key's purpose"
              maxLength={100}
            />
          </div>
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Permissions *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center p-3 border border-border rounded-lg bg-muted/30">
              <input
                type="checkbox"
                id="canRead"
                checked={formData.canRead}
                onChange={(e) =>
                  setFormData({ ...formData, canRead: e.target.checked })
                }
                className="h-4 w-4 text-primary rounded focus:ring-primary border-border"
              />
              <label htmlFor="canRead" className="ml-3">
                <div className="text-sm font-medium text-foreground">Read</div>
                <div className="text-xs text-muted-foreground">
                  View and retrieve data
                </div>
              </label>
            </div>

            <div className="flex items-center p-3 border border-border rounded-lg bg-muted/30">
              <input
                type="checkbox"
                id="canWrite"
                checked={formData.canWrite}
                onChange={(e) =>
                  setFormData({ ...formData, canWrite: e.target.checked })
                }
                className="h-4 w-4 text-primary rounded focus:ring-primary border-border"
              />
              <label htmlFor="canWrite" className="ml-3">
                <div className="text-sm font-medium text-foreground">Write</div>
                <div className="text-xs text-muted-foreground">
                  Create and modify data
                </div>
              </label>
            </div>

            <div className="flex items-center p-3 border border-border rounded-lg bg-muted/30">
              <input
                type="checkbox"
                id="canDelete"
                checked={formData.canDelete}
                onChange={(e) =>
                  setFormData({ ...formData, canDelete: e.target.checked })
                }
                className="h-4 w-4 text-primary rounded focus:ring-primary border-border"
              />
              <label htmlFor="canDelete" className="ml-3">
                <div className="text-sm font-medium text-foreground">
                  Delete
                </div>
                <div className="text-xs text-muted-foreground">
                  Remove data (use carefully)
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Access Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="allowedEndpoints"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Allowed Endpoints
            </label>
            <select
              id="allowedEndpoints"
              value={formData.allowedEndpoints}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  allowedEndpoints: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            >
              {ENDPOINT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {
                ENDPOINT_OPTIONS.find(
                  (o) => o.value === formData.allowedEndpoints
                )?.description
              }
            </p>
          </div>

          <div>
            <label
              htmlFor="rateLimit"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Rate Limit
            </label>
            <select
              id="rateLimit"
              value={formData.rateLimit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rateLimit: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            >
              {RATE_LIMIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.tier})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expiration */}
        <div>
          <label
            htmlFor="expiresInDays"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Expiration Period
          </label>
          <div className="flex items-center space-x-3">
            <input
              id="expiresInDays"
              type="number"
              min="1"
              max="3650"
              value={formData.expiresInDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expiresInDays: Math.max(
                    1,
                    Math.min(3650, parseInt(e.target.value) || 1)
                  ),
                })
              }
              className="w-32 px-3 py-2 border border-border rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            />
            <span className="text-sm text-foreground">days from now</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Expires on:{" "}
            {new Date(
              Date.now() + formData.expiresInDays * 24 * 60 * 60 * 1000
            ).toLocaleDateString()}
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={creating || !formData.name.trim()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {creating && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {creating ? "Creating..." : "Generate API Key"}
          </button>
        </div>
      </form>
    </div>
  );
}
