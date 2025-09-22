export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    requestId?: string;
    rateLimit?: {
      remaining: number;
      limit: number;
    };
    userId?: string;
    sessionId?: string;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
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
}

export interface Center {
  id: string;
  number: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  isActive: boolean;
}

export interface DisputeCenter {
  id: string;
  number: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  status: string;
  maxCapacity: number;
  currentCases: number;
  totalStaff: number;
  availableArbitrators: number;
  createdAt: string;
}