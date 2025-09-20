// src/app/components/api-keys/ApiKeyList.tsx
import { ApiKey } from "@/types/api-keys";

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  onEdit: (apiKey: ApiKey) => void;
  onRevoke: (apiKeyId: string) => void;
  revokingId: string | null;
}

export default function ApiKeyList({
  apiKeys,
  onEdit,
  onRevoke,
  revokingId,
}: ApiKeyListProps) {
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

  const getStatusText = (key: ApiKey) => {
    if (key.revokedAt) return "Revoked";
    if (isExpired(key.expiresAt)) return "Expired";
    if (key.isActive) return "Active";
    return "Inactive";
  };

  if (apiKeys.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔑</div>
          <p className="text-gray-500 text-lg">No API keys found.</p>
          <p className="text-sm text-gray-400 mt-2">
            Create your first API key to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Your API Keys</h2>
      </div>

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
                    {!key.canRead && !key.canWrite && !key.canDelete && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        No Permissions
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {key.usageCount || 0} requests
                  </div>
                  {key.lastUsed && (
                    <div className="text-xs text-gray-500">
                      Last used: {formatDate(key.lastUsed)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      key.revokedAt
                        ? "bg-red-100 text-red-800"
                        : isExpired(key.expiresAt)
                        ? "bg-orange-100 text-orange-800"
                        : key.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {getStatusText(key)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onEdit(key)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRevoke(key.id)}
                      disabled={revokingId === key.id}
                      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                    >
                      {revokingId === key.id ? "Revoking..." : "Revoke"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
