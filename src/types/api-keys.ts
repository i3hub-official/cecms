// src/types/api-keys.ts
export interface ApiKey {
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

export interface NewApiKeyResponse {
  id: string;
  name: string;
  keyId: string;
  apiKey: string; 
  prefix: string;
  expiresAt: string;
  createdAt: string;
   onRegenerate?: (keyId: string) => void;
   regenerateLoading?: string | null;
  isRegenerated?: boolean;
}

export interface ApiKeyUsage {
  date: string;
  requests: number;
  endpoint: string;
}

export interface ApiKeyFormData {
  name: string;
  description: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  allowedEndpoints: string;
  rateLimit: number;
  expiresInDays: number;
}


export interface ApiKeysManageProps {
  apiKeys: ApiKey[];
   onRefresh: () => void;
   onError: (error: string) => void;
   onSuccess: (message: string) => void;
    onRegenerate?: (keyId: string) => void;
   regenerateLoading?: string | null;
}

export interface ApiKeyListProps {
   apiKeys: ApiKey[];
   onEdit: (apiKey: ApiKey) => void;
   onRevoke: (apiKeyId: string) => void;
   revokingId: string | null;
   itemsPerPage?: number;
}


// Confirmation Modal Component
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  isDestructive?: boolean;
  loading?: boolean;
}


// API Key Display Modal Component
export interface ApiKeyDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  isRegenerated?: boolean;
  onCopy: (text: string) => void;
  timeLeft: number;
}
