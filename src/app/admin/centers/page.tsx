"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
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
  ConfirmationModalState,
} from "@/types/center";

// Import components
import NotificationContainer from "@/app/components/notifications/NotificationContainer";
import ConfirmationModal from "@/app/components/modals/ConfirmationModal"; 
import DuplicatesPanel from "@/app/components/centers/DuplicatesPanel";
import StatsGrid from "@/app/components/centers/StatsGrid";
import CenterFormModal from "@/app/components/centers/CenterFormModal";
import CentersTable from "@/app/components/centers/CentersTable";
import QuickActionsPanel from "@/app/components/centers/QuickActionsPanel";
import RecentActivityPanel from "@/app/components/centers/RecentActivityPanel";
import PaginationControls from "@/app/components/centers/PaginationControls";

// API functions
const api = {
  async getStates(): Promise<string[]> {
    try {
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

      if (typeof window !== "undefined") {
        sessionStorage.setItem("cachedStates", JSON.stringify(states));
      }

      return states;
    } catch (error: unknown) {
      console.error("Error fetching states:", error);
      return [
        "Error: Unable to load states at this time. Please check your connection.",
      ];
    }
  },

  async getLgas(state: string): Promise<string[]> {
    try {
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

      return data;
    } catch (error: unknown) {
      console.error("Error finding duplicates:", error);
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
      return {
        success: false,
        message: "Failed to merge centers. Please try again later.",
      };
    }
  },

  async createCenter(
    center: Omit<Center, "id" | "createdAt" | "modifiedAt" | "number">
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

export default function CentersPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationModal, setConfirmationModal] =
    useState<ConfirmationModalState>({
      isOpen: false,
      title: "",
      message: "",
      confirmText: "",
      cancelText: "Cancel",
      onConfirm: () => {},
      onCancel: () => {},
      type: "info",
    });

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
  const [isLoadingLgas, setIsLoadingLgas] = useState(false);
  const [lgas, setLgas] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState<string | null>(null);

  const lgaCache = useMemo(() => new Map<string, string[]>(), []);

  // Notification functions
  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification = { ...notification, id };
      setNotifications((prev) => [...prev, newNotification]);

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
  const showConfirmation = (options: Omit<ConfirmationModalState, "isOpen">) => {
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
  }, [addNotification]);

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
  }, [addNotification]);

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
  }, [addNotification]);

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
        addNotification({
          type: "info",
          title: "Processing Request",
          message: `Please wait while we ${action} ${center.name}...`,
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      let response: Center;
      
      if (editingCenter) {
        // Update existing center - don't change the number
        response = await api.updateCenter(editingCenter.id, {
          ...formData,
          modifiedBy: "current@user.com",
        });
        addNotification({
          type: "success",
          title: "Center Updated",
          message: `${formData.name} has been updated successfully. Center number: ${response.number}.`,
        });
      } else {
        // Create new center - server will generate the number
        response = await api.createCenter({
          ...formData,
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
          message: `${formData.name} has been created successfully with center number ${response.number}.`,
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

  const handleMerge = async (primaryId: string, secondaryIds: string[]) => {
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
          addNotification({
            type: "info",
            title: "Merging Centers...",
            message:
              "Please wait while we merge the selected centers. This may take a moment.",
          });

          await api.mergeCenters(primaryId, secondaryIds);
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
          setIsMerging(null);
        }
      },
      onCancel: () => {
        setIsMerging(null);
      },
    });
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    if (field === "state") {
      setFormData({ ...formData, [field]: value as string, lga: "" });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleRefreshData = () => {
    addNotification({
      type: "info",
      title: "Refreshing Data",
      message: "Reloading all data",
    });
    loadCenters();
    loadStats();
    loadDuplicates();
    setSearchTerm("");
  };

  const handleTestAPI = () => {
    addNotification({
      type: "info",
      title: "API Test",
      message: "Opening API endpoint in new tab",
    });
    window.open("/api/centers-lookup?number=CTR001", "_blank");
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 dark:text-red-400 text-sm sm:text-base">
                {error}
              </span>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Duplicates Alert */}
        {duplicates.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0" />
                <span className="text-foreground text-sm sm:text-base">
                  {duplicates.length} potential duplicate(s) found
                </span>
              </div>
              <button
                onClick={() => setShowDuplicates(!showDuplicates)}
                className="bg-amber-200 dark:bg-amber-900/50 hover:bg-amber-300 dark:hover:bg-amber-900/70 text-amber-800 dark:text-amber-300 px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium self-start sm:self-auto transition-colors"
              >
                {showDuplicates ? "Hide" : "Review"}
              </button>
            </div>
          </div>
        )}

        {/* Duplicates Review Panel */}
        <DuplicatesPanel
          duplicates={duplicates}
          showDuplicates={showDuplicates}
          onClose={() => setShowDuplicates(false)}
          onMerge={handleMerge}
          isMerging={isMerging}
        />

        {/* Header and Controls */}
        <div className="bg-card rounded-xl shadow-sm p-4 sm:p-6 border border-border">
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
                onClick={handleRefreshData}
                className="sm:hidden p-2 bg-background hover:bg-background/80 rounded-lg transition-colors"
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
                  className="pl-9 sm:pl-10 w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm sm:text-base bg-background text-foreground"
                />
              </div>

              {/* Checkbox */}
              <label className="flex items-center whitespace-nowrap bg-background px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-card transition-colors cursor-pointer border border-border">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <span className="ml-2 text-sm font-medium text-foreground">
                  Include inactive
                </span>
              </label>

              {/* Add Button */}
              <button
                onClick={handleAdd}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg flex items-center justify-center text-sm font-medium whitespace-nowrap transition-colors shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Add Center
              </button>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        <CenterFormModal
          showForm={showForm}
          editingCenter={editingCenter}
          formData={formData}
          formErrors={formErrors}
          states={locationData.states}
          lgas={lgas}
          isLoadingLgas={isLoadingLgas}
          isSubmitting={isSubmitting}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
          onFormChange={handleFormChange}
        />

        {/* Stats Grid */}
        <StatsGrid stats={stats} duplicatesCount={duplicates.length} />

        {/* Centers Table */}
        <CentersTable
          centers={centers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          searchTerm={searchTerm}
        />

        {/* Pagination Controls */}
        <PaginationControls
          pagination={pagination}
          onPageChange={handlePageChange}
        />

        {/* Bottom Section - Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Recent Centers */}
          <RecentActivityPanel centers={centers} />

          {/* Quick Actions */}
          <QuickActionsPanel
            onAddCenter={handleAdd}
            onFindDuplicates={loadDuplicates}
            onRefreshData={handleRefreshData}
            onTestAPI={handleTestAPI}
          />
        </div>
      </div>
    </div>
  );
}


