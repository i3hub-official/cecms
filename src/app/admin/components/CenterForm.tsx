"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Building,
  AlertCircle,
  MapPin,
  Merge,
  AlertTriangle,
  X,
  RefreshCw,
  MoreVertical,
  XCircle,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  Center,
  CentersResponse,
  DashboardStats,
  MergeResult,
  Notification,
  Stats,
  Duplicate,
  LocationData,
} from "@/types/center";
import type { ConfirmationModal } from "@/types/center";

// Real API functions using your actual database
const api = {
  async getStates(): Promise<string[]> {
    try {
      // Check if we're in a browser environment before using sessionStorage
      if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem("cachedStates");
        if (cached) return JSON.parse(cached);
      }

      const res = await fetch("https://apinigeria.vercel.app/api/v1/states");

      if (!res.ok) {
        throw new Error(
          `Failed to fetch states: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();

      if (!data || !Array.isArray(data.states)) {
        throw new Error("Unexpected API response format for states");
      }

      const states = data.states;

      // Only cache if we're in a browser environment
      if (typeof window !== "undefined") {
        sessionStorage.setItem("cachedStates", JSON.stringify(states));
      }

      return states;
    } catch (error: unknown) {
      console.error("Error fetching states:", error);

      // Provide graceful fallback (don't break flow)
      return [
        "Error: Unable to load states at this time. Please check your connection.",
      ];
    }
  },

  async getLgas(state: string): Promise<string[]> {
    try {
      // Check if we're in a browser environment before using sessionStorage
      let lgaMap = new Map<string, string[]>();
      if (typeof window !== "undefined") {
        const cachedLgas = sessionStorage.getItem("cachedLgas");
        lgaMap = cachedLgas
          ? new Map(Object.entries(JSON.parse(cachedLgas)))
          : new Map();
      }

      if (lgaMap.has(state)) return lgaMap.get(state) as string[];

      const res = await fetch(
        `https://apinigeria.vercel.app/api/v1/lga?state=${encodeURIComponent(
          state
        )}`
      );

      if (!res.ok) {
        throw new Error(
          `Failed to fetch LGAs for "${state}": ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();

      if (!data || !Array.isArray(data.lgas)) {
        throw new Error(
          `Unexpected API response format for LGAs in "${state}"`
        );
      }

      const lgas = data.lgas;

      // Cache updated data only if we're in a browser environment
      if (typeof window !== "undefined") {
        lgaMap.set(state, lgas);
        sessionStorage.setItem(
          "cachedLgas",
          JSON.stringify(Object.fromEntries(lgaMap))
        );
      }

      return lgas;
    } catch (error: unknown) {
      console.error(`Error fetching LGAs for state "${state}":`, error);

      // Graceful fallback
      return [
        `Error: Unable to load LGAs for "${state}". Please check your connection.`,
      ];
    }
  },

  async getCenters(
    page = 1,
    limit = 10,
    search = "",
    includeInactive = false
  ): Promise<CentersResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        includeInactive: includeInactive.toString(),
      });

      const response = await fetch(`/api/centers?${params}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch centers (page=${page}, limit=${limit}, search="${search}") → ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.centers)) {
        throw new Error("Unexpected API response format for centers");
      }

      return {
        centers: data.centers,
        pagination: data.pagination || { page, limit, total: 0, pages: 0 },
      };
    } catch (error: unknown) {
      console.error("Error fetching centers:", error);

      // Graceful fallback
      return {
        centers: [],
        pagination: { page, limit, total: 0, pages: 0 },
      };
    }
  },

  async getStats(): Promise<DashboardStats> {
    try {
      const response = await fetch("/api/dashboard");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch stats → ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data?.data?.centers) {
        throw new Error("Unexpected API response format for statistics");
      }

      return {
        total: data.data.centers.total || 0,
        active: data.data.centers.active || 0,
        inactive: data.data.centers.inactive || 0,
        inactiveCenters: data.data.inactiveCenters || [],
        recentActivity: data.data.recentCenters || [],
      };
    } catch (error: unknown) {
      console.error("Error fetching stats:", error);

      // Graceful fallback
      return {
        total: 0,
        active: 0,
        inactive: 0,
        inactiveCenters: [],
        recentActivity: [
          {
            id: "error",
            name: "Failed to load statistics",
            state: "",
            lga: "",
            address: "N/A",
            number: "",
            isActive: false,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            createdBy: "system",
            createdById: "system",
            createdByName: "System",
            modifiedBy: "system",
            modifiedById: "system",
            modifiedByName: "System",
          },
        ],
      };
    }
  },

  async findDuplicates(): Promise<Duplicate[]> {
    try {
      const response = await fetch("/api/centers/duplicates");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch duplicates → ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected API response format for duplicates");
      }

      // The API now returns the correct Duplicate[] structure
      return data;
    } catch (error: unknown) {
      console.error("Error finding duplicates:", error);

      // Graceful fallback
      return [];
    }
  },

  async mergeCenters(
    primaryId: string,
    secondaryIds: string[]
  ): Promise<MergeResult> {
    try {
      const response = await fetch("/api/centers/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId, secondaryIds }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to merge centers (primary=${primaryId}, secondary=${secondaryIds.join(
            ", "
          )}) → ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data) {
        throw new Error("Unexpected API response format after merge");
      }

      return {
        success: data.success || false,
        message: data.message || "Centers merged successfully",
        mergedCount: data.mergedCount,
      };
    } catch (error: unknown) {
      console.error("Error merging centers:", error);

      // Graceful fallback
      return {
        success: false,
        message: "Failed to merge centers. Please try again later.",
      };
    }
  },

  async createCenter(
    center: Omit<Center, "id" | "createdAt" | "modifiedAt">
  ): Promise<Center> {
    try {
      const response = await fetch("/api/centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(center),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create center");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating center:", error);
      throw error;
    }
  },

  async updateCenter(id: string, updates: Partial<Center>): Promise<Center> {
    try {
      const response = await fetch(`/api/centers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update center");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating center:", error);
      throw error;
    }
  },

  async deleteCenter(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/centers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete center");
      }

      return true;
    } catch (error) {
      console.error("Error deleting center:", error);
      throw error;
    }
  },
};

// Helper function to generate center number
const generateCenterNumber = (
  state: string,
  lga: string,
  stateList: string[],
  lgaMap: { [key: string]: string[] }
): string => {
  // State index (1-based) → 3 digits
  const stateIndex = stateList.indexOf(state);
  const stateCode = (stateIndex >= 0 ? stateIndex + 1 : 0)
    .toString()
    .padStart(3, "0");

  // LGA index (1-based) → 2 digits
  const lgaList = lgaMap[state] || [];
  const lgaIndex = lgaList.indexOf(lga);
  const lgaCode = (lgaIndex >= 0 ? lgaIndex + 1 : 0)
    .toString()
    .padStart(2, "0");

  // Random 2 digits
  const randomDigits = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");

  return `${stateCode}${lgaCode}${randomDigits}`;
};

// Enhanced Notification Component
function NotificationContainer({
  notifications,
  removeNotification,
}: {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative bg-card rounded-lg shadow-lg border-l-4 p-3 transition-all duration-300 ease-in-out transform animate-in slide-in-from-right-5 ${
            notification.type === "success"
              ? "border-success"
              : notification.type === "error"
              ? "border-danger"
              : notification.type === "warning"
              ? "border-warning"
              : "border-info"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === "success" && (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              {notification.type === "error" && (
                <XCircle className="h-4 w-4 text-danger" />
              )}
              {notification.type === "warning" && (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
              {notification.type === "info" && (
                <Info className="h-4 w-4 text-info" />
              )}
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground truncate">
                {notification.title}
              </h4>
              <p className="mt-1 text-xs text-foreground/70 line-clamp-2">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 inline-flex text-gray-400 hover:text-foreground/70 transition-colors p-1"
            >
              <XCircle className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Confirmation Modal Component
function ConfirmationModal({
  modal,
  onClose,
}: {
  modal: ConfirmationModal;
  onClose: () => void;
}) {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          {modal.type === "danger" && (
            <AlertTriangle className="h-6 w-6 text-danger mr-3" />
          )}
          {modal.type === "warning" && (
            <AlertCircle className="h-6 w-6 text-warning mr-3" />
          )}
          {modal.type === "info" && (
            <AlertCircle className="h-6 w-6 text-info mr-3" />
          )}
          <h3 className="text-lg font-medium text-foreground">{modal.title}</h3>
        </div>
        <p className="text-foreground/70 mb-6">{modal.message}</p>
        <div className="flex flex-col-reverse sm:flex-row sm:space-x-3">
          <button
            onClick={() => {
              modal.onCancel();
              onClose();
            }}
            className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 text-foreground bg-card border border-gray-300 rounded-md hover:background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {modal.cancelText}
          </button>
          <button
            onClick={() => {
              modal.onConfirm();
              onClose();
            }}
            className={`w-full sm:w-auto px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              modal.type === "danger"
                ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                : modal.type === "warning"
                ? "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500"
                : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
            }`}
          >
            {modal.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CenterManagementSystem() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal>(
    {
      isOpen: false,
      title: "",
      message: "",
      confirmText: "",
      cancelText: "Cancel",
      onConfirm: () => {},
      onCancel: () => {},
      type: "info",
    }
  );

  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    inactiveCenters: [],
    recentActivity: [],
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>({
    states: [],
    lgas: {},
  });
  const [showForm, setShowForm] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    state: "",
    lga: "",
    isActive: true,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);
  const [isLoadingLgas, setIsLoadingLgas] = useState(false);
  const [lgas, setLgas] = useState<string[]>([]);

  const lgaCache = useMemo(() => new Map<string, string[]>(), []);

  // Notification functions
  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification = { ...notification, id };
      setNotifications((prev) => [...prev, newNotification]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Confirmation modal functions
  const showConfirmation = (options: Omit<ConfirmationModal, "isOpen">) => {
    setConfirmationModal({
      ...options,
      isOpen: true,
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  };

  const loadCenters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getCenters(
        pagination.page,
        pagination.limit,
        searchTerm,
        includeInactive
      );

      if (result) {
        setCenters(result.centers);
        setPagination(result.pagination);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to load centers. Please try again.";
      setError(errorMsg);
      addNotification({
        type: "error",
        title: "Loading Error",
        message: errorMsg,
      });
      console.error("Error loading centers:", err);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    searchTerm,
    includeInactive,
    addNotification,
  ]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err) {
      console.error("Error loading stats:", err);
      addNotification({
        type: "error",
        title: "Stats Loading Error",
        message: "Failed to load statistics",
      });
    }
  }, []);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = "Center name is required";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }

    if (!formData.state) {
      errors.state = "State is required";
    }

    if (!formData.lga) {
      errors.lga = "LGA is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadLocationData = useCallback(async () => {
    try {
      const states = await api.getStates();
      setLocationData({ states, lgas: {} });
    } catch (err) {
      console.error("Error loading location data:", err);
      addNotification({
        type: "error",
        title: "Location Data Error",
        message: "Failed to load states and LGAs",
      });
      setLocationData({ states: [], lgas: {} });
    }
  }, []);

  const loadDuplicates = useCallback(async () => {
    try {
      const duplicatesData = await api.findDuplicates();

      // The API already returns the correct structure, so don't transform it
      setDuplicates(duplicatesData);
    } catch (err) {
      console.error("Error loading duplicates:", err);
      addNotification({
        type: "error",
        title: "Duplicates Check Error",
        message: "Failed to check for duplicates",
      });
    }
  }, []);

  useEffect(() => {
    loadCenters();
  }, [loadCenters]);

  useEffect(() => {
    loadStats();
    loadLocationData();
    loadDuplicates();
  }, [loadStats, loadLocationData, loadDuplicates]);

  // Load LGAs when state changes
  useEffect(() => {
    const fetchLgas = async () => {
      if (!formData.state) {
        setLgas([]);
        return;
      }

      // Check cache first
      if (lgaCache.has(formData.state)) {
        setLgas(lgaCache.get(formData.state) || []);
        return;
      }

      setIsLoadingLgas(true);
      try {
        const lgasList = await api.getLgas(formData.state);
        setLgas(lgasList);
        lgaCache.set(formData.state, lgasList);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load LGAs";
        addNotification({
          type: "error",
          title: "LGA Loading Error",
          message: errorMessage,
        });
        setLgas([]);
      } finally {
        setIsLoadingLgas(false);
      }
    };

    fetchLgas();
  }, [formData.state, addNotification, lgaCache]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleAdd = () => {
    setEditingCenter(null);
    setFormData({
      name: "",
      address: "",
      state: "",
      lga: "",
      isActive: true,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (center: Center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      address: center.address,
      state: center.state,
      lga: center.lga,
      isActive: center.isActive,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (center: Center) => {
    const action = center.isActive ? "deactivate" : "permanently delete";
    const actionTitle = action.charAt(0).toUpperCase() + action.slice(1);

    showConfirmation({
      title: `${actionTitle} Center`,
      message: `Are you sure you want to ${action} "${center.name}"? This action cannot be undone.`,
      confirmText: actionTitle,
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        // Show immediate feedback
        addNotification({
          type: "info",
          title: "Processing Request",
          message: `Please wait while we ${action} ${center.name}... You will be notified once it's done.`,
        });

        try {
          await api.deleteCenter(center.id);
          await Promise.all([loadCenters(), loadStats()]);

          setError(null);
          addNotification({
            type: "success",
            title: "Success",
            message: `${center.name} has been ${action}d successfully.`,
          });
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to delete center.";
          setError(errorMsg);
          addNotification({
            type: "error",
            title: "Error",
            message: errorMsg,
          });
        }
      },
      onCancel: () => {},
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      return;
    }

    try {
      // Generate center number based on state and LGA
      const centerNumber = generateCenterNumber(
        formData.state,
        formData.lga,
        locationData.states,
        locationData.lgas
      );

      if (editingCenter) {
        await api.updateCenter(editingCenter.id, {
          ...formData,
          number: centerNumber,
          modifiedBy: "current@user.com",
        });
        addNotification({
          type: "success",
          title: "Center Updated",
          message: `${formData.name} has been updated successfully.`,
        });
      } else {
        await api.createCenter({
          ...formData,
          number: centerNumber,
          createdBy: "current@user.com",
          createdById: "current-user-id",
          createdByName: "Current User",
          modifiedBy: "current@user.com",
          modifiedById: "current-user-id",
          modifiedByName: "Current User",
        });
        addNotification({
          type: "success",
          title: "Center Created",
          message: `${formData.name} has been created successfully with center number ${centerNumber}.`,
        });
      }
      setShowForm(false);
      setFormErrors({});
      await loadCenters();
      await loadStats();
      await loadDuplicates();
      setError(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to save center. Please try again.";
      setError(errorMsg);
      addNotification({
        type: "error",
        title: "Save Failed",
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isMerging, setIsMerging] = useState<string | null>(null);

  const handleMerge = async (primaryId: string, secondaryIds: string[]) => {
    // Set merging state for this specific operation
    const mergeId = `${primaryId}-${secondaryIds.join("-")}`;
    setIsMerging(mergeId);

    showConfirmation({
      title: "Merge Centers",
      message:
        "Are you sure you want to merge these centers? This action cannot be undone.",
      confirmText: "Merge",
      cancelText: "Cancel",
      type: "warning",
      onConfirm: async () => {
        try {
          // Show processing notification
          addNotification({
            type: "info",
            title: "Merging Centers...",
            message:
              "Please wait while we merge the selected centers. This may take a moment.",
          });
          // Perform the merge
          await api.mergeCenters(primaryId, secondaryIds);

          // Reload all data in parallel for better performance
          await Promise.all([loadCenters(), loadStats(), loadDuplicates()]);

          addNotification({
            type: "success",
            title: "Merge Completed",
            message: "Centers have been merged successfully.",
          });
        } catch (err) {
          console.error("Merge error:", err);
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to merge centers. Please try again.";

          addNotification({
            type: "error",
            title: "Merge Failed",
            message: errorMessage,
          });
        } finally {
          // Clear merging state
          setIsMerging(null);
        }
      },
      onCancel: () => {
        // Clear merging state if user cancels
        setIsMerging(null);
      },
    });
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        modal={confirmationModal}
        onClose={closeConfirmation}
      />

      <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 text-sm sm:text-base">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Duplicates Alert */}
        {duplicates.length > 0 && (
          <div className="bg-warning/20 border border-warning/30 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning mr-2 flex-shrink-0" />
                <span className="text-foreground text-sm sm:text-base">
                  {duplicates.length} potential duplicate(s) found
                </span>
              </div>
              <button
                onClick={() => setShowDuplicates(!showDuplicates)}
                className="bg-warning/30 hover:bg-warning/40 text-foreground px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium self-start sm:self-auto transition-colors"
              >
                {showDuplicates ? "Hide" : "Review"}
              </button>
            </div>
          </div>
        )}

        {/* Duplicates Review Panel */}
        {showDuplicates && duplicates.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">
                Review Potential Duplicates ({duplicates.length})
              </h3>
              <button
                onClick={() => setShowDuplicates(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {duplicates.map((duplicate, index) => {
                if (!duplicate?.centers || duplicate.centers.length < 2) {
                  return null;
                }

                return (
                  <div
                    key={`duplicate-${index}-${duplicate.centers[0]?.id}-${duplicate.centers[1]?.id}`}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <span className="text-sm text-muted-foreground">
                        {duplicate.similarity || "Unknown"}% similarity (
                        {duplicate.type || "unknown"} match)
                      </span>
                      <button
                        onClick={() =>
                          handleMerge(duplicate.centers[0].id, [
                            duplicate.centers[1].id,
                          ])
                        }
                        disabled={
                          isMerging ===
                          `${duplicate.centers[0].id}-${duplicate.centers[1].id}`
                        }
                        className="bg-success/20 hover:bg-success/30 text-success px-3 py-1 rounded text-sm flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isMerging ===
                        `${duplicate.centers[0].id}-${duplicate.centers[1].id}` ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Merging...
                          </>
                        ) : (
                          <>
                            <Merge className="h-4 w-4 mr-1" />
                            Merge
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {duplicate.centers
                        .slice(0, 2)
                        .map((center, centerIndex) => (
                          <div
                            key={`center-${center.id}-${index}-${centerIndex}`}
                            className="border border-border rounded-lg p-3"
                          >
                            <div className="font-medium text-foreground text-sm">
                              {center.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              #{center.number}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {center.address}
                            </div>
                            <div className="text-xs text-muted-foreground/70 mt-2">
                              Created: {formatShortDate(center.createdAt)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Header and Controls */}
        <div className="bg-card rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Title Section with Mobile Refresh Button */}
            <div className="flex items-center justify-between">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  Centers
                </h1>
                <p className="text-foreground/70 mt-1 text-sm sm:text-base">
                  Manage education centers efficiently
                </p>
              </div>
              {/* Mobile Refresh Button */}
              <button
                onClick={() => {
                  addNotification({
                    type: "info",
                    title: "Refreshing Data",
                    message: "Reloading all data",
                  });
                  loadCenters();
                  loadStats();
                  loadDuplicates();
                  setSearchTerm("");
                }}
                className="sm:hidden p-2 background hover:background/10 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="h-5 w-5 text-foreground/70" />
              </button>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary h-4 w-4 sm:h-5 sm:w-5" />
                <input
                  type="text"
                  placeholder="Search centers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
              </div>

              {/* Checkbox */}
              <label className="flex items-center whitespace-nowrap background px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:background/10 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-primary">
                  Include inactive
                </span>
              </label>

              {/* Add Button */}
              <button
                onClick={handleAdd}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg flex items-center justify-center text-sm font-medium whitespace-nowrap transition-colors shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Add Center
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={isSubmitting ? undefined : () => setShowForm(false)}
            />

            {/* Modal content */}
            <div className="relative bg-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    {editingCenter ? "Edit Center" : "Add New Center"}
                  </h2>
                  <button
                    onClick={
                      isSubmitting ? undefined : () => setShowForm(false)
                    }
                    disabled={isSubmitting}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Form content */}
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {/* Center Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Center Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={isSubmitting}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        formErrors.name
                          ? "border-destructive bg-destructive/10"
                          : "border-border"
                      }`}
                      placeholder="Enter center name"
                    />
                    {formErrors.name && (
                      <p className="text-destructive text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Address Field */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Address *
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      disabled={isSubmitting}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        formErrors.address
                          ? "border-destructive bg-destructive/10"
                          : "border-border"
                      }`}
                      rows={2}
                      placeholder="Enter full address"
                    />
                    {formErrors.address && (
                      <p className="text-destructive text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.address}
                      </p>
                    )}
                  </div>

                  {/* State Field */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      State *
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          state: e.target.value,
                          lga: "",
                        })
                      }
                      disabled={isSubmitting}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        formErrors.state
                          ? "border-destructive bg-destructive/10"
                          : "border-border"
                      }`}
                    >
                      <option value="">Select State</option>
                      {locationData.states
                        .filter(
                          (state) =>
                            state !== null &&
                            state !== undefined &&
                            state.trim() !== ""
                        )
                        .map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                    </select>
                    {formErrors.state && (
                      <p className="text-destructive text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.state}
                      </p>
                    )}
                  </div>

                  {/* LGA Field */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      LGA *
                    </label>
                    <select
                      value={formData.lga}
                      onChange={(e) =>
                        setFormData({ ...formData, lga: e.target.value })
                      }
                      disabled={
                        !formData.state || isLoadingLgas || isSubmitting
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        formErrors.lga
                          ? "border-destructive bg-destructive/10"
                          : "border-border"
                      }`}
                    >
                      <option value="">Select LGA</option>
                      {isLoadingLgas ? (
                        <option value="" disabled>
                          Loading LGAs...
                        </option>
                      ) : (
                        lgas
                          .filter(
                            (lga) =>
                              lga !== null &&
                              lga !== undefined &&
                              lga.trim() !== ""
                          )
                          .map((lga, index) => (
                            <option key={`${lga}-${index}`} value={lga}>
                              {lga}
                            </option>
                          ))
                      )}
                    </select>
                    {formErrors.lga && (
                      <p className="text-destructive text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.lga}
                      </p>
                    )}
                    {isLoadingLgas && (
                      <p className="text-success text-xs mt-1 flex items-center">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Loading LGAs...
                      </p>
                    )}
                    {!formData.state && !formErrors.lga && !isLoadingLgas && (
                      <p className="text-muted-foreground text-xs mt-1">
                        Select state first
                      </p>
                    )}
                  </div>

                  {/* Active Checkbox */}
                  <div className="flex items-center bg-background/30 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      disabled={isSubmitting}
                      className="h-4 w-4 text-success focus:ring-primary border-border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="ml-2">
                      <span className="text-sm text-foreground">
                        Active Center
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Center is available and operational
                      </p>
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 text-foreground bg-card border border-border rounded-lg hover:bg-background text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {editingCenter ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>{editingCenter ? "Update" : "Create"}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[
            {
              icon: Building,
              value: stats.total,
              label: "Total Centers",
              color: "green",
            },
            {
              icon: CheckCircle,
              value: stats.active,
              label: "Active Centers",
              color: "green",
            },
            {
              icon: AlertCircle,
              value: stats.inactive,
              label: "Inactive Centers",
              color: "red",
            },
            {
              icon: AlertTriangle,
              value: duplicates.length,
              label: "Duplicates Found",
              color: "yellow",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              green: "text-success",
              red: "text-danger",
              yellow: "text-warning",
            }[stat.color];

            return (
              <div
                key={index}
                className="bg-card rounded-lg shadow p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon
                      className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 ${colorClasses}`}
                    />
                  </div>
                  <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                    <div className="text-base sm:text-lg lg:text-2xl font-bold text-foreground">
                      {stat.value || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-foreground/70 truncate">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Centers Table/Cards with Skeleton Loading */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          {loading ? (
            // Skeleton Loading
            <div className="p-3 sm:p-6 lg:p-8">
              {/* Mobile Skeleton */}
              <div className="space-y-3 sm:hidden">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-lg p-3 animate-pulse"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-5 bg-background rounded-full w-16"></div>
                          <div className="h-4 bg-background rounded w-12"></div>
                        </div>
                        <div className="h-4 bg-background rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-background rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-background rounded w-2/3"></div>
                      </div>
                      <div className="h-4 w-4 bg-background rounded"></div>
                    </div>
                    <div className="h-3 bg-background rounded w-1/3"></div>
                  </div>
                ))}
              </div>

              {/* Tablet Skeleton */}
              <div className="hidden sm:grid md:grid-cols-2 lg:hidden gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-lg p-4 animate-pulse"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-5 bg-background rounded-full w-20"></div>
                          <div className="h-4 bg-background rounded w-16"></div>
                        </div>
                        <div className="h-5 bg-background rounded w-4/5 mb-2"></div>
                        <div className="h-4 bg-background rounded w-3/4 mb-1"></div>
                        <div className="h-4 bg-background rounded w-2/3"></div>
                      </div>
                      <div className="flex space-x-1">
                        <div className="h-8 w-8 bg-background rounded"></div>
                        <div className="h-8 w-8 bg-background rounded"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-background rounded w-2/5"></div>
                  </div>
                ))}
              </div>

              {/* Desktop Skeleton */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="background">
                      <tr>
                        {[
                          "Center Details",
                          "Location",
                          "Status",
                          "Last Modified",
                          "Actions",
                        ].map((header) => (
                          <th
                            key={header}
                            className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-gray-200">
                      {[...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-4 xl:px-6 py-4">
                            <div className="h-4 bg-background rounded w-32 mb-2"></div>
                            <div className="h-3 bg-background rounded w-20"></div>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            <div className="h-4 bg-background rounded w-48 mb-2"></div>
                            <div className="h-3 bg-background rounded w-32"></div>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            <div className="h-6 bg-background rounded-full w-16"></div>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            <div className="h-3 bg-background rounded w-24 mb-1"></div>
                            <div className="h-3 bg-background rounded w-20"></div>
                          </td>
                          <td className="px-4 xl:px-6 py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <div className="h-6 w-6 bg-background rounded"></div>
                              <div className="h-6 w-6 bg-background rounded"></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Loading text */}
              <div className="text-center mt-4">
                <p className="text-sm text-foreground/70">Loading centers...</p>
              </div>
            </div>
          ) : centers.length === 0 ? (
            <div className="p-6 lg:p-8 text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 background/10 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                <Search className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
              </div>
              <h3 className="text-base lg:text-lg font-medium text-foreground mb-2">
                No centers found
              </h3>
              <p className="text-sm text-foreground/70 mb-3 lg:mb-4">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "Get started by adding your first center."}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAdd}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm lg:text-base font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 inline" />
                  Add First Center
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3 p-3">
                {centers.map((center) => (
                  <div
                    key={center.id}
                    className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              center.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {center.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            #{center.number}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                          {center.name}
                        </h3>
                        <p className="text-xs text-foreground/70 mb-1 line-clamp-2">
                          {center.address}
                        </p>
                        <div className="text-xs text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          {center.state}, {center.lga}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setMobileMenuOpen(
                            mobileMenuOpen === center.id ? null : center.id
                          )
                        }
                        className="text-gray-400 hover:text-foreground/70 p-1 ml-2 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>

                    {mobileMenuOpen === center.id && (
                      <div className="flex justify-end space-x-2 pt-2 border-t border-border animate-fadeIn">
                        <button
                          onClick={() => {
                            handleEdit(center);
                            setMobileMenuOpen(null);
                          }}
                          className="flex items-center text-success text-xs px-3 py-1 rounded border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(center);
                            setMobileMenuOpen(null);
                          }}
                          className="flex items-center text-danger text-xs px-3 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {center.isActive ? "Deactivate" : "Delete"}
                        </button>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-border">
                      Updated {formatShortDate(center.modifiedAt)}
                      {center.modifiedBy && ` by ${center.modifiedByName}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet Cards */}
              <div className="hidden sm:grid md:grid-cols-2 lg:hidden gap-4 p-4">
                {centers.map((center) => (
                  <div
                    key={center.id}
                    className="bg-card border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              center.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {center.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            #{center.number}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-foreground mb-1 truncate">
                          {center.name}
                        </h3>
                        <p
                          className="text-xs text-foreground/70 mb-1 line-clamp-2"
                          title={center.address}
                        >
                          {center.address}
                        </p>
                        <div className="text-xs text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {center.state}, {center.lga}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => handleEdit(center)}
                          className="text-success hover:text-green-800 p-1 rounded transition-colors"
                          title="Edit center"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(center)}
                          className="text-danger hover:text-red-800 p-1 rounded transition-colors"
                          title={
                            center.isActive
                              ? "Deactivate center"
                              : "Delete center"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      Updated {formatShortDate(center.modifiedAt)}
                      {center.modifiedBy && ` by ${center.modifiedBy}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <table className="hidden lg:table min-w-full">
                <thead className="background">
                  <tr>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Center Details
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Modified
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-gray-200">
                  {centers.map((center) => (
                    <tr
                      key={center.id}
                      className="hover:background transition-colors"
                    >
                      <td className="px-4 xl:px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {center.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            #{center.number}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 xl:px-6 py-4">
                        <div>
                          <div
                            className="text-sm text-foreground max-w-xs truncate"
                            title={center.address}
                          >
                            {center.address}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            {center.state}, {center.lga}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 xl:px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            center.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {center.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {formatDate(center.modifiedAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {center.modifiedBy ? `by ${center.modifiedBy}` : ""}
                        </div>
                      </td>
                      <td className="px-4 xl:px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(center)}
                            className="text-success hover:text-green-800 p-1 rounded transition-colors"
                            title="Edit center"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(center)}
                            className="text-danger hover:text-red-800 p-1 rounded transition-colors"
                            title={
                              center.isActive
                                ? "Deactivate center"
                                : "Delete center"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Pagination Controls */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-card rounded-lg shadow p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs sm:text-sm text-foreground/70 text-center sm:text-left">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} centers
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-card border border-gray-300 rounded-md disabled:opacity-50 hover:background min-w-[60px] sm:min-w-[70px] transition-colors"
                >
                  Previous
                </button>
                <span className="px-2 py-1 text-xs sm:text-sm text-foreground/70">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-card border border-gray-300 rounded-md disabled:opacity-50 hover:background min-w-[60px] sm:min-w-[70px] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section - Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Recent Centers */}
          <div className="bg-card rounded-xl shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Recent Centers
              </h2>
              <p className="text-xs sm:text-sm text-foreground/70 mt-1">
                Latest centers added to the system
              </p>
            </div>
            <div className="flex-1 p-4 sm:p-6">
              {centers.length === 0 ? (
                <div className="text-center text-gray-500 py-6 sm:py-8">
                  <Building className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-primary" />
                  <p className="text-sm sm:text-base font-medium">
                    No centers yet
                  </p>
                  <p className="text-xs sm:text-sm mt-1">
                    Add your first center to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {centers.slice(0, 5).map((center) => (
                    <div
                      key={center.id}
                      className="relative p-3 sm:p-4 bg-background rounded-lg hover:background/10 transition-colors"
                    >
                      {/* Active/Inactive Badge - Top Right */}
                      <span
                        className={`absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${
                          center.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {center.isActive ? "Active" : "Inactive"}
                      </span>

                      {/* Content - Adjusted padding to prevent badge overlap */}
                      <div className="pr-14 sm:pr-16">
                        {/* Center Name */}
                        <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2">
                          {center.name}
                        </p>

                        {/* Center Number + State */}
                        <p className="text-xs text-gray-500 mt-1">
                          #{center.number} • {center.state}
                        </p>
                      </div>

                      {/* Timestamp - Bottom Right */}
                      <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-xs text-gray-400">
                        {formatShortDate(center.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Quick Actions
              </h2>
              <p className="text-xs sm:text-sm text-foreground/70 mt-1">
                Common tasks and utilities
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  {
                    icon: Plus,
                    label: "Add Center",
                    description: "Create new center",
                    color: "green",
                    bgColor: "bg-background",
                    hoverColor: "hover:bg-green-100",
                    action: handleAdd,
                  },
                  {
                    icon: Merge,
                    label: "Find Duplicates",
                    description: "Detect similar centers",
                    color: "yellow",
                    bgColor: "bg-background",
                    hoverColor: "hover:bg-yellow-100",
                    action: () => loadDuplicates(),
                  },
                  {
                    icon: Eye,
                    label: "Test API",
                    description: "Try public lookup",
                    color: "green",
                    bgColor: "bg-background",
                    hoverColor: "hover:bg-green-100",
                    action: () => {
                      addNotification({
                        type: "info",
                        title: "API Test",
                        message: "Opening API endpoint in new tab",
                      });
                      window.open(
                        "/api/centers-lookup?number=CTR001",
                        "_blank"
                      );
                    },
                  },
                  {
                    icon: RefreshCw,
                    label: "Refresh Data",
                    description: "Reload all data",
                    color: "green",
                    bgColor: "bg-background",
                    hoverColor: "hover:bg-green-100",
                    action: () => {
                      addNotification({
                        type: "info",
                        title: "Refreshing Data",
                        message: "Reloading all data",
                      });
                      loadCenters();
                      loadStats();
                      loadDuplicates();
                      setSearchTerm("");
                    },
                  },
                ].map((action, index) => {
                  const Icon = action.icon;
                  const colorClasses = {
                    green: "text-success",
                    yellow: "text-warning",
                  }[action.color];

                  return (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`flex items-center p-3 sm:p-4 rounded-xl ${action.bgColor} ${action.hoverColor} transition-all hover:shadow-sm border border-transparent hover:border-opacity-20`}
                    >
                      <div className="flex-shrink-0 p-2 bg-card rounded-lg shadow-sm">
                        <Icon
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${colorClasses}`}
                        />
                      </div>
                      <div className="ml-3 text-left">
                        <div
                          className={`text-xs sm:text-sm font-medium ${colorClasses}`}
                        >
                          {action.label}
                        </div>
                        <div className="text-xs text-foreground/70">
                          {action.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
