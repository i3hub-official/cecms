export interface Center {
  id: string;
  number: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string;
  modifiedBy: string | null;
  modifiedById: string;
  modifiedByName: string;
  createdByName: string;
}

export interface Stats {
  total: number;
  active: number;
  inactive: number;
  inactiveCenters: Center[];
  recentActivity: Center[];
}

export interface Duplicate {
  centers: Center[];
  similarity: number;
  type: "name" | "address" | "location";
}

export interface LocationData {
  states: string[];
  lgas: { [state: string]: string[] };
}

// types.ts (create this file if it doesn't exist)
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CentersResponse {
  centers: Center[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  inactiveCenters: Center[];
  recentActivity: Center[];
}

export interface MergeResult {
  success: boolean;
  message: string;
  mergedCount?: number;
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  type: "info" | "warning" | "danger";
}

export interface Stats {
  total: number;
  active: number;
  inactive: number;
  inactiveCenters: Center[];
  recentActivity: Center[];
}

export interface Duplicate {
  centers: Center[];
  similarity: number;
  type: "name" | "address" | "location";
}

export interface LocationData {
  states: string[];
  lgas: { [state: string]: string[] };
}
