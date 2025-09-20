"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ApiKey {
  id: string;
  prefix: string;
  name: string;
  description?: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  allowedEndpoints: string;
  rateLimit: number;
  isActive: boolean;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  usage?: string;
}

interface NewApiKeyResponse {
  id: string;
  name: string;
  apiKey: string;
  prefix: string;
  expiresAt: string;
  createdAt: string;
}

interface ApiKeyUsage {
  date: string;
  requests: number;
  endpoint: string;
}

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

export default function ApiKeysPage() {
  const router = useRouter();

  // State management
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<NewApiKeyResponse | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [keyUsage, setKeyUsage] = useState<ApiKeyUsage[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    canRead: true,
    canWrite: false,
    canDelete: false,
    allowedEndpoints: "*",
    rateLimit: 100,
    expiresInDays: 365,
  });

  const [editFormData, setEditFormData] = useState<Partial<ApiKey>>({});

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

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      fetchApiKeys();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // API Functions
  const fetchApiKeys = async () => {
    try {
      setError(null);
      const response = await fetch("/apis/v1/user/api-keys", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          router.push("/auth/signin");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setApiKeys(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      setError("Failed to fetch API keys. Please try again.");
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.canRead && !formData.canWrite && !formData.canDelete) {
      setError("At least one permission must be selected");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/apis/v1/user/api-keys", {
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
        if (response.status === 401) {
          setIsAuthenticated(false);
          router.push("/auth/signin");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      setNewKey(data.data);
      setShowNewKey(true);
      setSuccess("API key created successfully!");

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

      // Switch to manage tab and refresh list
      setActiveTab("manage");
      await fetchApiKeys();
    } catch (error) {
      console.error("Failed to create API key:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create API key"
      );
    } finally {
      setCreating(false);
    }
  };

  const updateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedKey) {
      setError("No key selected");
      return;
    }

    setUpdating(selectedKey.id);
    setError(null);

    try {
      const response = await fetch(`/apis/v1/user/api-keys/${selectedKey.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          router.push("/auth/signin");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      setSuccess("API key updated successfully!");
      setShowEditModal(false);
      setSelectedKey(null);
      setEditFormData({});
      await fetchApiKeys();
    } catch (error) {
      console.error("Failed to update API key:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update API key"
      );
    } finally {
      setUpdating(null);
    }
  };

  const revokeApiKey = async (apiKeyId: string) => {
    setRevoking(apiKeyId);
    setError(null);

    try {
      const response = await fetch("/apis/v1/user/api-keys", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ apiKeyId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          router.push("/auth/signin");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      setSuccess("API key revoked successfully!");
      await fetchApiKeys();
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      setError(
        error instanceof Error ? error.message : "Failed to revoke API key"
      );
    } finally {
      setRevoking(null);
    }
  };

  const regenerateApiKey = async (apiKeyId: string) => {
    try {
      const response = await fetch(
        `/apis/v1/user/api-keys/${apiKeyId}/regenerate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          router.push("/auth/signin");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      setNewKey(data.data);
      setShowNewKey(true);
      setSuccess("API key regenerated successfully!");
      await fetchApiKeys();
    } catch (error) {
      console.error("Failed to regenerate API key:", error);
      setError(
        error instanceof Error ? error.message : "Failed to regenerate API key"
      );
    }
  };

  const fetchKeyUsage = async (apiKeyId: string) => {
    try {
      const response = await fetch(`/apis/v1/user/api-keys/${apiKeyId}/usage`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setKeyUsage(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
    }
  };

  // Utility Functions
  const handleEdit = (apiKeyId: string) => {
    const keyToEdit = apiKeys.find((key) => key.id === apiKeyId);
    if (keyToEdit) {
      setSelectedKey(keyToEdit);
      setEditFormData(keyToEdit);
      setShowEditModal(true);
    }
  };

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

  const formatDate = (dateString: string) => {
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

  const isExpired = (dateString: string) => {
    try {
      return new Date(dateString) < new Date();
    } catch {
      return false;
    }
  };

  const getStatusColor = (key: ApiKey) => {
    if (key.revokedAt) return "bg-red-100 text-red-800";
    if (isExpired(key.expiresAt)) return "bg-orange-100 text-orange-800";
    if (key.isActive) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusText = (key: ApiKey) => {
    if (key.revokedAt) return "Revoked";
    if (isExpired(key.expiresAt)) return "Expired";
    if (key.isActive) return "Active";
    return "Inactive";
  };

  // Loading and Authentication States
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="ml-3 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-red-700">Please log in to manage your API keys.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          API Key Management
        </h1>
        <p className="text-gray-600">
          Create, manage, and monitor your API keys for secure access to our
          services.
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-green-400 mr-3">✓</div>
            <p className="text-green-700">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("create")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "create"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Create New Key
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "manage"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Manage Keys ({apiKeys.length})
          </button>
        </nav>
      </div>

      {/* Create New API Key Tab */}
      {activeTab === "create" && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Create New API Key
            </h2>
            <p className="text-gray-600">
              Generate a new API key with specific permissions and access
              controls.
            </p>
          </div>

          <form onSubmit={createApiKey} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Production App, Mobile Client"
                  maxLength={50}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description of this key's purpose"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="canRead"
                    checked={formData.canRead}
                    onChange={(e) =>
                      setFormData({ ...formData, canRead: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="canRead" className="ml-3">
                    <div className="text-sm font-medium text-gray-700">
                      Read
                    </div>
                    <div className="text-xs text-gray-500">
                      View and retrieve data
                    </div>
                  </label>
                </div>

                <div className="flex items-center p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="canWrite"
                    checked={formData.canWrite}
                    onChange={(e) =>
                      setFormData({ ...formData, canWrite: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="canWrite" className="ml-3">
                    <div className="text-sm font-medium text-gray-700">
                      Write
                    </div>
                    <div className="text-xs text-gray-500">
                      Create and modify data
                    </div>
                  </label>
                </div>

                <div className="flex items-center p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="canDelete"
                    checked={formData.canDelete}
                    onChange={(e) =>
                      setFormData({ ...formData, canDelete: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="canDelete" className="ml-3">
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

            {/* Access Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="allowedEndpoints"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ENDPOINT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
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
                  className="block text-sm font-medium text-gray-700 mb-2"
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

            {/* Expiration */}
            <div>
              <label
                htmlFor="expiresInDays"
                className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-700">days from now</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Expires on:{" "}
                {new Date(
                  Date.now() + formData.expiresInDays * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={creating || !formData.name.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {creating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {creating ? "Creating..." : "Generate API Key"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage Keys Tab */}
      {activeTab === "manage" && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">
                Total Keys
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {apiKeys.length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">
                Active Keys
              </div>
              <div className="text-2xl font-bold text-green-600">
                {
                  apiKeys.filter(
                    (key) =>
                      !key.revokedAt &&
                      key.isActive &&
                      !isExpired(key.expiresAt)
                  ).length
                }
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">
                Expired Keys
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {
                  apiKeys.filter(
                    (key) => isExpired(key.expiresAt) && !key.revokedAt
                  ).length
                }
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">
                Revoked Keys
              </div>
              <div className="text-2xl font-bold text-red-600">
                {apiKeys.filter((key) => key.revokedAt).length}
              </div>
            </div>
          </div>

          {/* API Keys List */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Your API Keys
              </h2>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔑</div>
                <p className="text-gray-500 text-lg">No API keys found.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create your first API key to get started.
                </p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create API Key
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name & Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {key.name}
                            </div>
                            {key.description && (
                              <div className="text-sm text-gray-500">
                                {key.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              Created: {formatDate(key.createdAt)}
                            </div>
                            {key.lastUsed && (
                              <div className="text-xs text-gray-400">
                                Last used: {formatDate(key.lastUsed)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono text-gray-900">
                            {key.prefix}...
                          </div>
                          <div className="text-xs text-gray-500">
                            Expires: {formatDate(key.expiresAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {key.canRead && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Read
                              </span>
                            )}
                            {key.canWrite && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Write
                              </span>
                            )}
                            {key.canDelete && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Delete
                              </span>
                            )}
                            {!key.canRead &&
                              !key.canWrite &&
                              !key.canDelete && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                  No Permissions
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {key.usage}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getStatusText(key)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(key.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => revokeApiKey(key.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
