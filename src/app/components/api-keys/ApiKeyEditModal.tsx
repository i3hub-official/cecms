// src/app/components/api-keys/ApiKeyEditModal.tsx
import { useState } from "react";
import { ApiKey } from "@/types/api-keys";

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

interface ApiKeyEditModalProps {
  apiKey: ApiKey;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function ApiKeyEditModal({
  apiKey,
  onClose,
  onSuccess,
  onError,
}: ApiKeyEditModalProps) {
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: apiKey.name,
    description: apiKey.description || "",
    canRead: apiKey.canRead,
    canWrite: apiKey.canWrite,
    canDelete: apiKey.canDelete,
    allowedEndpoints: apiKey.allowedEndpoints,
    rateLimit: apiKey.rateLimit,
    isActive: apiKey.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      onError("Name is required");
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(`/apis/v1/user/api-key/${apiKey.id}`, {
        method: "PATCH",
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

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update API key:", error);
      onError(
        error instanceof Error ? error.message : "Failed to update API key"
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/70 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Edit API Key
          </h2>
          <button
            onClick={onClose}
            className="text-foreground/50 hover:text-foreground text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                API Key Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="e.g., Production App, Mobile Client"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Optional description"
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Permissions *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center p-3 border border-border rounded-lg bg-background">
                <input
                  type="checkbox"
                  checked={formData.canRead}
                  onChange={(e) =>
                    setFormData({ ...formData, canRead: e.target.checked })
                  }
                  className="h-4 w-4 text-primary rounded focus:ring-primary border-border bg-card"
                />
                <label className="ml-3">
                  <div className="text-sm font-medium text-foreground">
                    Read
                  </div>
                  <div className="text-xs text-foreground/70">
                    View and retrieve data
                  </div>
                </label>
              </div>

              <div className="flex items-center p-3 border border-border rounded-lg bg-background">
                <input
                  type="checkbox"
                  checked={formData.canWrite}
                  onChange={(e) =>
                    setFormData({ ...formData, canWrite: e.target.checked })
                  }
                  className="h-4 w-4 text-primary rounded focus:ring-primary border-border bg-card"
                />
                <label className="ml-3">
                  <div className="text-sm font-medium text-foreground">
                    Write
                  </div>
                  <div className="text-xs text-foreground/70">
                    Create and modify data
                  </div>
                </label>
              </div>

              <div className="flex items-center p-3 border border-border rounded-lg bg-background">
                <input
                  type="checkbox"
                  checked={formData.canDelete}
                  onChange={(e) =>
                    setFormData({ ...formData, canDelete: e.target.checked })
                  }
                  className="h-4 w-4 text-primary rounded focus:ring-primary border-border bg-card"
                />
                <label className="ml-3">
                  <div className="text-sm font-medium text-foreground">
                    Delete
                  </div>
                  <div className="text-xs text-foreground/70">
                    Remove data (use carefully)
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Allowed Endpoints
              </label>
              <select
                value={formData.allowedEndpoints}
                onChange={(e) =>
                  setFormData({ ...formData, allowedEndpoints: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {ENDPOINT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rate Limit
              </label>
              <select
                value={formData.rateLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rateLimit: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {RATE_LIMIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.tier})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4 text-primary rounded focus:ring-primary border-border bg-card"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-foreground"
            >
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="bg-primary text-white px-6 py-2 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {updating && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {updating ? "Updating..." : "Update API Key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
