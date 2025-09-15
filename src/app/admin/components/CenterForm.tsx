"use client";
import { useState, useEffect, useCallback } from "react";
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
  Check,
  RefreshCw,
  MoreVertical,
} from "lucide-react";

interface Center {
  id: string;
  number: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy: string | null;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  inactiveCenters: Center[];
  recentActivity: Center[];
}

interface Duplicate {
  centers: Center[];
  similarity: number;
  type: "name" | "address" | "location";
}

interface LocationData {
  states: string[];
  lgas: { [state: string]: string[] };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

interface ConfirmationModal {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  type: "danger" | "warning" | "info";
}

// Real API functions using your actual database
const api = {
  async getStates(): Promise<string[]> {
    const cached = sessionStorage.getItem("cachedStates");
    if (cached) return JSON.parse(cached);

    const res = await fetch("https://apinigeria.vercel.app/api/v1/states");
    if (!res.ok) throw new Error("Failed to fetch states");
    const data = await res.json();
    const states = data.states || [];
    sessionStorage.setItem("cachedStates", JSON.stringify(states));
    return states;
  },

  async getLgas(state: string): Promise<string[]> {
    const cachedLgas = sessionStorage.getItem("cachedLgas");
    const lgaMap = cachedLgas
      ? new Map(Object.entries(JSON.parse(cachedLgas)))
      : new Map();

    if (lgaMap.has(state)) return lgaMap.get(state) as string[];

    const res = await fetch(
      `https://apinigeria.vercel.app/api/v1/lga?state=${encodeURIComponent(
        state
      )}`
    );
    if (!res.ok) throw new Error("Failed to fetch LGAs");
    const data = await res.json();
    const lgas = data.lgas || [];

    lgaMap.set(state, lgas);
    sessionStorage.setItem(
      "cachedLgas",
      JSON.stringify(Object.fromEntries(lgaMap))
    );

    return lgas;
  },

  async getCenters(page = 1, limit = 10, search = "", includeInactive = false) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        includeInactive: includeInactive.toString(),
      });

      const response = await fetch(`/api/centers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch centers");

      const data = await response.json();
      return {
        centers: data.centers || [],
        pagination: data.pagination || { page, limit, total: 0, pages: 0 },
      };
    } catch (error) {
      console.error("Error fetching centers:", error);
      throw new Error("Failed to load centers");
    }
  },

  async getStats() {
    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      return {
        total: data.data?.centers?.total || 0,
        active: data.data?.centers?.active || 0,
        inactive: data.data?.centers?.inactive || 0,
        inactiveCenters: [],
        recentActivity: data.data?.recentCenters || [],
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw new Error("Failed to load statistics");
    }
  },

  async findDuplicates() {
    try {
      const response = await fetch("/api/centers/duplicates");
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error("Error finding duplicates:", error);
      throw new Error("Failed to find duplicates");
    }
  },

  async mergeCenters(primaryId: string, secondaryIds: string[]) {
    try {
      const response = await fetch("/api/centers/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId, secondaryIds }),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Error merging centers:", error);
      throw new Error("Failed to merge centers");
    }
  },

  async createCenter(center: Omit<Center, "id" | "createdAt" | "modifiedAt">) {
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

  async updateCenter(id: string, updates: Partial<Center>) {
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

  async deleteCenter(id: string) {
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

// Notification Component
function NotificationContainer({
  notifications,
  removeNotification,
}: {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex space-x-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-in slide-in-from-right-5 ${
            notification.type === "success"
              ? "bg-green-50 ring-green-200"
              : notification.type === "error"
              ? "bg-red-50 ring-red-200"
              : notification.type === "warning"
              ? "bg-yellow-50 ring-yellow-200"
              : "bg-blue-50 ring-blue-200"
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
                {notification.type === "error" && (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                {notification.type === "warning" && (
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                )}
                {notification.type === "info" && (
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p
                  className={`text-sm font-medium ${
                    notification.type === "success"
                      ? "text-green-900"
                      : notification.type === "error"
                      ? "text-red-900"
                      : notification.type === "warning"
                      ? "text-yellow-900"
                      : "text-blue-900"
                  }`}
                >
                  {notification.title}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    notification.type === "success"
                      ? "text-green-700"
                      : notification.type === "error"
                      ? "text-red-700"
                      : notification.type === "warning"
                      ? "text-yellow-700"
                      : "text-blue-700"
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className={`rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === "success"
                      ? "focus:ring-green-500"
                      : notification.type === "error"
                      ? "focus:ring-red-500"
                      : notification.type === "warning"
                      ? "focus:ring-yellow-500"
                      : "focus:ring-blue-500"
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          {modal.type === "danger" && (
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          )}
          {modal.type === "warning" && (
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
          )}
          {modal.type === "info" && (
            <AlertCircle className="h-6 w-6 text-blue-600 mr-3" />
          )}
          <h3 className="text-lg font-medium text-gray-900">{modal.title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{modal.message}</p>
        <div className="flex flex-col-reverse sm:flex-row sm:space-x-3">
          <button
            onClick={() => {
              modal.onCancel();
              onClose();
            }}
            className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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

  const lgaCache = new Map<string, string[]>();

  // Notification functions
  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    setNotifications((prev) => [...prev, newNotification]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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
  }, [pagination.page, pagination.limit, searchTerm, includeInactive]);

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
  }, [formData.state]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
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

    showConfirmation({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Center`,
      message: `Are you sure you want to ${action} "${center.name}"? This action cannot be undone.`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.deleteCenter(center.id);
          await loadCenters();
          await loadStats();
          setError(null);
          addNotification({
            type: "success",
            title: "Center Deleted",
            message: `${center.name} has been ${
              center.isActive ? "deactivated" : "deleted"
            } successfully.`,
          });
        } catch (err) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : "Failed to delete center. Please try again.";
          setError(errorMsg);
          addNotification({
            type: "error",
            title: "Delete Failed",
            message: errorMsg,
          });
        }
      },
      onCancel: () => {},
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
          modifiedBy: null,
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
    }
  };

  const handleMerge = async (primaryId: string, secondaryIds: string[]) => {
    showConfirmation({
      title: "Merge Centers",
      message:
        "Are you sure you want to merge these centers? This action cannot be undone.",
      confirmText: "Merge",
      cancelText: "Cancel",
      type: "warning",
      onConfirm: async () => {
        try {
          await api.mergeCenters(primaryId, secondaryIds);
          await loadCenters();
          await loadStats();
          await loadDuplicates();
          addNotification({
            type: "success",
            title: "Centers Merged",
            message: "Centers have been merged successfully.",
          });
        } catch (err) {
          addNotification({
            type: "error",
            title: "Merge Failed",
            message: "Failed to merge centers. Please try again.",
          });
        }
      },
      onCancel: () => {},
    });
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 text-sm sm:text-base">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Duplicates Alert */}
        {duplicates.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                <span className="text-yellow-700 text-sm sm:text-base">
                  {duplicates.length} potential duplicate(s) found
                </span>
              </div>
              <button
                onClick={() => setShowDuplicates(!showDuplicates)}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium self-start sm:self-auto"
              >
                {showDuplicates ? "Hide" : "Review"}
              </button>
            </div>
          </div>
        )}

        {/* Duplicates Review Panel */}
        {showDuplicates && duplicates.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Review Duplicates
            </h3>
            <div className="space-y-4">
              {duplicates.map((duplicate, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {duplicate.similarity}% similarity ({duplicate.type}{" "}
                      match)
                    </span>
                    <button
                      onClick={() =>
                        handleMerge(duplicate.centers[0].id, [
                          duplicate.centers[1].id,
                        ])
                      }
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs sm:text-sm flex items-center self-start sm:self-auto"
                    >
                      <Merge className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Merge
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {duplicate.centers.map((center) => (
                      <div
                        key={center.id}
                        className="border border-gray-100 rounded-lg p-3"
                      >
                        <div className="font-medium text-gray-900 text-sm sm:text-base">
                          {center.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          #{center.number}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {center.address}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {formatShortDate(center.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header and Controls */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Centers
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage education centers
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                <input
                  type="text"
                  placeholder="Search centers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 w-full sm:w-auto text-sm sm:text-base px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-700">
                  Include inactive
                </span>
              </label>

              <button
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md flex items-center justify-center text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                Add Center
              </button>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    {editingCenter ? "Edit Center" : "Add New Center"}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-500 p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                {/* Center Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Center Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter center name"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Address Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.address ? "border-red-300" : "border-gray-300"
                    }`}
                    rows={3}
                    placeholder="Enter full address"
                  />
                  {formErrors.address && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.address}
                    </p>
                  )}
                </div>

                {/* State Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.state ? "border-red-300" : "border-gray-300"
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
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.state}
                    </p>
                  )}
                </div>

                {/* LGA Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LGA *
                  </label>
                  <select
                    value={formData.lga}
                    onChange={(e) =>
                      setFormData({ ...formData, lga: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.lga ? "border-red-300" : "border-gray-300"
                    }`}
                    disabled={!formData.state || isLoadingLgas}
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
                        .map((lga) => (
                          <option key={lga} value={lga}>
                            {lga}
                          </option>
                        ))
                    )}
                  </select>
                  {formErrors.lga && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.lga}
                    </p>
                  )}
                  {isLoadingLgas && (
                    <p className="text-xs text-gray-500 mt-1">
                      Loading LGAs for {formData.state}...
                    </p>
                  )}
                  {!formData.state && !formErrors.lga && !isLoadingLgas && (
                    <p className="text-xs text-gray-500 mt-1">
                      Please select a state first
                    </p>
                  )}
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Active Center
                  </span>
                </div>

                {/* Form Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mt-6">
                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {editingCenter ? "Update Center" : "Create Center"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Centers Table/Cards */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 lg:p-8 text-center">
              <RefreshCw className="w-6 h-6 lg:w-8 lg:h-8 animate-spin text-blue-600 mx-auto mb-3 lg:mb-4" />
              <p className="text-sm lg:text-base text-gray-600">
                Loading centers...
              </p>
            </div>
          ) : centers.length === 0 ? (
            <div className="p-6 lg:p-8 text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                <Search className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
              </div>
              <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
                No centers found
              </h3>
              <p className="text-sm text-gray-600 mb-3 lg:mb-4">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "Get started by adding your first center."}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAdd}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm lg:text-base font-medium"
                >
                  <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 inline" />
                  Add First Center
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="hidden lg:table min-w-full">
                <thead className="bg-gray-50">
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {centers.map((center) => (
                    <tr
                      key={center.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 xl:px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
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
                            className="text-sm text-gray-900 max-w-xs truncate"
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
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="Edit center"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(center)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
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

              {/* Mobile/Tablet Cards */}
              <div className="lg:hidden">
                {/* Tablet View (md) */}
                <div className="hidden md:block lg:hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {centers.map((center) => (
                      <div
                        key={center.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
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
                                {center.isActive ? "Active" : "Inactive"}
                              </span>
                              <span className="text-xs text-gray-500">
                                #{center.number}
                              </span>
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1 truncate">
                              {center.name}
                            </h3>
                            <p
                              className="text-xs text-gray-600 mb-1 line-clamp-2"
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
                              className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                              title="Edit center"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(center)}
                              className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
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
                </div>

                {/* Mobile View (sm and below) */}
                <div className="md:hidden space-y-3 p-3">
                  {centers.map((center) => (
                    <div
                      key={center.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
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
                              {center.isActive ? "Active" : "Inactive"}
                            </span>
                            <span className="text-xs text-gray-500">
                              #{center.number}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {center.name}
                          </h3>
                          <p className="text-xs text-gray-600 mb-1 line-clamp-2">
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
                          className="text-gray-400 hover:text-gray-600 p-1 ml-2"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>

                      {mobileMenuOpen === center.id && (
                        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => {
                              handleEdit(center);
                              setMobileMenuOpen(null);
                            }}
                            className="flex items-center text-blue-600 text-xs px-3 py-1 rounded border border-blue-200 bg-blue-50"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(center);
                              setMobileMenuOpen(null);
                            }}
                            className="flex items-center text-red-600 text-xs px-3 py-1 rounded border border-red-200 bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {center.isActive ? "Deactivate" : "Delete"}
                          </button>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2">
                        Updated {formatShortDate(center.modifiedAt)}
                        {center.modifiedBy && ` by ${center.modifiedBy}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} centers
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-xs sm:text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 min-w-[70px] sm:min-w-[80px]"
                >
                  Previous
                </button>
                <span className="px-2 py-1 text-xs sm:text-sm text-gray-600">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-xs sm:text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 min-w-[70px] sm:min-w-[80px]"
                >
                  Next
                </button>
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
              color: "blue",
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
              blue: "text-blue-600",
              green: "text-green-600",
              red: "text-red-600",
              yellow: "text-yellow-600",
            }[stat.color];

            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 lg:h-8 lg:w-8 ${colorClasses}`} />
                  </div>
                  <div className="ml-3 lg:ml-4 min-w-0">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 truncate">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Section - Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Recent Centers */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
              <h2 className="text-base lg:text-lg font-medium text-gray-900">
                Recent Centers
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              {centers.length === 0 ? (
                <div className="text-center text-gray-500 py-4 lg:py-6">
                  <Building className="h-8 w-8 lg:h-12 lg:w-12 mx-auto mb-2 lg:mb-4 text-gray-300" />
                  <p className="text-sm lg:text-base">No centers yet</p>
                </div>
              ) : (
                <div className="space-y-3 lg:space-y-4">
                  {centers.slice(0, 5).map((center) => (
                    <div
                      key={center.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                              center.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {center.isActive ? "Active" : "Inactive"}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {center.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              #{center.number} • {center.state}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2 flex-shrink-0">
                        {formatShortDate(center.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
              <h2 className="text-base lg:text-lg font-medium text-gray-900">
                Quick Actions
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                {[
                  {
                    icon: Plus,
                    label: "Add Center",
                    description: "Create new center",
                    color: "blue",
                    action: handleAdd,
                  },
                  {
                    icon: Merge,
                    label: "Find Duplicates",
                    description: "Detect similar centers",
                    color: "yellow",
                    action: () => loadDuplicates(),
                  },
                  {
                    icon: Eye,
                    label: "Test API",
                    description: "Try public lookup",
                    color: "green",
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
                    color: "purple",
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
                    blue: "text-blue-600",
                    yellow: "text-yellow-600",
                    green: "text-green-600",
                    purple: "text-purple-600",
                  }[action.color];
                  return (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`flex items-center p-2 rounded-md text-sm font-medium ${colorClasses}`}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {action.label}
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
