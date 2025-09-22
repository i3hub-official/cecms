// src/app/components/api-keys/ApiKeysManage.tsx
import { useState } from "react";
import { ApiKey, ApiKeysManageProps } from "@/types/api-keys";
import ApiKeyStats from "./ApiKeyStats";
import ApiKeyList from "./ApiKeyList";
import ApiKeyEditModal from "./ApiKeyEditModal";

// Extended props interface to include regenerate functionality
interface ExtendedApiKeysManageProps extends ApiKeysManageProps {
  onRegenerate?: (keyId: string) => void;
  regenerateLoading?: string | null;
}

export default function ApiKeysManage({
  apiKeys,
  onRefresh,
  onError,
  onSuccess,
  onRegenerate,
  regenerateLoading,
}: ExtendedApiKeysManageProps) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const revokeApiKey = async (apiKeyId: string) => {
    setRevoking(apiKeyId);

    try {
      const response = await fetch("/apis/v1/user/api-key", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ apiKeyId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      onSuccess("API key revoked successfully!");
      onRefresh();
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      onError(
        error instanceof Error ? error.message : "Failed to revoke API key"
      );
    } finally {
      setRevoking(null);
    }
  };

  const handleRegenerate = (apiKeyId: string) => {
    if (onRegenerate) {
      onRegenerate(apiKeyId);
    }
  };

  const handleEdit = (apiKey: ApiKey) => {
    setSelectedKey(apiKey);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <ApiKeyStats apiKeys={apiKeys} />
      <ApiKeyList
        apiKeys={apiKeys}
        onEdit={handleEdit}
        onRevoke={revokeApiKey}
        onRegenerate={handleRegenerate}
        revokingId={revoking}
        regeneratingId={regenerateLoading || null}
      />

      {showEditModal && selectedKey && (
        <ApiKeyEditModal
          apiKey={selectedKey}
          onClose={() => {
            setShowEditModal(false);
            setSelectedKey(null);
          }}
          onSuccess={() => {
            onSuccess("API key updated successfully!");
            onRefresh();
          }}
          onError={onError}
        />
      )}
    </div>
  );
}
