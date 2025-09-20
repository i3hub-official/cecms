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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Edit API Key</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Production App, Mobile Client"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description"
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.canRead}
                  onChange={(e) =>
                    setFormData({ ...formData, canRead: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label className="ml-3">
                  <div className="text-sm font-medium text-gray-700">Read</div>
                  <div className="text-xs text-gray-500">
                    View and retrieve data
                  </div>
                </label>
              </div>

              <div className="flex items-center p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.canWrite}
                  onChange={(e) =>
                    setFormData({ ...formData, canWrite: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label className="ml-3">
                  <div className="text-sm font-medium text-gray-700">Write</div>
                  <div className="text-xs text-gray-500">
                    Create and modify data
                  </div>
                </label>
              </div>

              <div className="flex items-center p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.canDelete}
                  onChange={(e) =>
                    setFormData({ ...formData, canDelete: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label className="ml-3">
                  <div className="text-sm font-medium text-gray-700">
                    Delete
                  </div>
                  <div className="text-xs text-gray-500">
                    Remove data (use carefully)
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Endpoints
              </label>
              <select
                value={formData.allowedEndpoints}
                onChange={(e) =>
                  setFormData({ ...formData, allowedEndpoints: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ENDPOINT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700"
            >
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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
