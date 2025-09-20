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
  apiKey: string; 
  prefix: string;
  expiresAt: string;
  createdAt: string;
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
