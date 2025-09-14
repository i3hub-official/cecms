"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  Building,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
  MoreVertical,
  RefreshCw,
  MapPin,
  Merge,
  AlertTriangle,
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

interface CentersResponse {
  centers: Center[];
  pagination: Pagination;
}

// Real API functions using your Prisma database
const api = {
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
      return { centers: [], pagination: { page, limit, total: 0, pages: 0 } };
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
      return {
        total: 0,
        active: 0,
        inactive: 0,
        inactiveCenters: [],
        recentActivity: [],
      };
    }
  },

  async getLocationData() {
    // Check if we have cached data
    const cached = localStorage.getItem("cachedStates");
    const cachedTimestamp = localStorage.getItem("cachedTimestamp");
    const now = Date.now();

    // Use cache if it's less than 24 hours old
    if (
      cached &&
      cachedTimestamp &&
      now - parseInt(cachedTimestamp) < 24 * 60 * 60 * 1000
    ) {
      return {
        states: JSON.parse(cached),
        lgas: {},
      };
    }

    // Fetch from external API
    const response = await fetch("https://apinigeria.vercel.app/api/v1/states");
    if (!response.ok) {
      throw new Error("Failed to fetch states");  
    }

    const data = await response.json();
    const statesList = data.states?.map((state: any) => state.name) || [];

    // Cache the results
    localStorage.setItem("cachedStates", JSON.stringify(statesList));
    localStorage.setItem("cachedTimestamp", now.toString());

    return {
      states: statesList,
      lgas: {},
    };
  },

  async getLgasForState(state: string) {
    // Check cache first
    const cacheKey = `lgas-${state}`;
    const cached = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);
    const now = Date.now();

    if (
      cached &&
      cachedTimestamp &&
      now - parseInt(cachedTimestamp) < 24 * 60 * 60 * 1000
    ) {
      return JSON.parse(cached);
    }

    // Fetch from external API
    const response = await fetch(
      `https://apinigeria.vercel.app/api/v1/lga?state=${encodeURIComponent(
        state
      )}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch LGAs");
    }

    const data = await response.json();
    const lgasList = data.lgas || [];

    // Cache the results
    localStorage.setItem(cacheKey, JSON.stringify(lgasList));
    localStorage.setItem(`${cacheKey}-timestamp`, now.toString());

    return lgasList;
  },

  async findDuplicates() {
    // You'll need to implement this functionality
    try {
      // Placeholder - implement duplicate detection logic
      return [];
    } catch (error) {
      console.error("Error finding duplicates:", error);
      return [];
    }
  },

  async mergeCenters(primaryId: string, secondaryIds: string[]) {
    // You'll need to implement this functionality
    try {
      // Placeholder - implement merge logic
      return { success: true };
    } catch (error) {
      console.error("Error merging centers:", error);
      return { success: false };
    }
  },

  // Keep your existing create, update, delete functions
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
};

export default function CenterManagementSystem() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
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
    number: "",
    name: "",
    address: "",
    state: "",
    lga: "",
    isActive: true,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);

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
      setError("Failed to load centers. Please try again.");
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
    }
  }, []);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.number.trim()) {
      errors.number = "Center number is required";
    }

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
      const locationData = await api.getLocationData();
      setLocationData(locationData);
    } catch (err) {
      console.error("Error loading location data:", err);
      setError("Failed to load location data. Please try again.");
      // No fallback - set empty data
      setLocationData({ states: [], lgas: {} });
    }
  }, []);

  const loadDuplicates = useCallback(async () => {
    try {
      const duplicatesData = await api.findDuplicates();
      setDuplicates(duplicatesData);
    } catch (err) {
      console.error("Error loading duplicates:", err);
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
      number: "",
      name: "",
      address: "",
      state: "",
      lga: "",
      isActive: true,
    });
    setShowForm(true);
  };

  const handleEdit = (center: Center) => {
    setEditingCenter(center);
    setFormData({
      number: center.number,
      name: center.name,
      address: center.address,
      state: center.state,
      lga: center.lga,
      isActive: center.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (center: Center) => {
    const action = center.isActive ? "deactivate" : "permanently delete";
    if (
      window.confirm(`Are you sure you want to ${action} "${center.name}"?`)
    ) {
      try {
        await api.deleteCenter(center.id);
        await loadCenters();
        await loadStats();
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to delete center. Please try again."
        );
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingCenter) {
        await api.updateCenter(editingCenter.id, {
          ...formData,
          modifiedBy: "current@user.com",
        });
      } else {
        await api.createCenter({
          ...formData,
          createdBy: "current@user.com",
          modifiedBy: null,
        });
      }
      setShowForm(false);
      setFormErrors({});
      await loadCenters();
      await loadStats();
      await loadDuplicates();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save center. Please try again."
      );
    }
  };

  const handleMerge = async (primaryId: string, secondaryIds: string[]) => {
    try {
      await api.mergeCenters(primaryId, secondaryIds);
      await loadCenters();
      await loadStats();
      await loadDuplicates();
    } catch (err) {
      setError("Failed to merge centers. Please try again.");
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Duplicates Alert */}
      {duplicates.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-yellow-700">
                {duplicates.length} potential duplicate(s) found
              </span>
            </div>
            <button
              onClick={() => setShowDuplicates(!showDuplicates)}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              {showDuplicates ? "Hide" : "Review"}
            </button>
          </div>
        </div>
      )}

      {/* Duplicates Review Panel */}
      {showDuplicates && duplicates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Review Duplicates
          </h3>
          <div className="space-y-4">
            {duplicates.map((duplicate, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {duplicate.similarity}% similarity ({duplicate.type} match)
                  </span>
                  <button
                    onClick={() =>
                      handleMerge(duplicate.centers[0].id, [
                        duplicate.centers[1].id,
                      ])
                    }
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm flex items-center"
                  >
                    <Merge className="h-4 w-4 mr-1" />
                    Merge
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {duplicate.centers.map((center) => (
                    <div
                      key={center.id}
                      className="border border-gray-100 rounded-lg p-3"
                    >
                      <div className="font-medium text-gray-900">
                        {center.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        #{center.number}
                      </div>
                      <div className="text-sm text-gray-600">
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
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Centers
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Manage education centers
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
              <input
                type="text"
                placeholder="Search centers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 w-full text-sm md:text-base px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Include inactive
              </span>
            </label>

            <button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center text-sm md:text-base whitespace-nowrap"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Add Center
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingCenter ? "Edit Center" : "Add New Center"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Center Number Field with Validation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Center Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.number ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter center number"
                />
                {formErrors.number && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.number}
                  </p>
                )}
              </div>

              {/* Center Name Field with Validation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Center Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter center name"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Address Field with Validation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

              {/* State Field with Validation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value, lga: "" })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.state ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select State</option>
                  {locationData.states.map((state) => (
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

              {/* LGA Field with Validation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LGA *
                </label>
                <select
                  required
                  value={formData.lga}
                  onChange={(e) =>
                    setFormData({ ...formData, lga: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.lga ? "border-red-300" : "border-gray-300"
                  }`}
                  disabled={!formData.state}
                >
                  <option value="">Select LGA</option>
                  {formData.state &&
                    locationData.lgas[formData.state]?.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                </select>
                {formErrors.lga && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.lga}</p>
                )}
                {!formData.state && !formErrors.lga && (
                  <p className="text-xs text-gray-500 mt-1">
                    Please select a state first
                  </p>
                )}
              </div>

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

              <div className="flex flex-col sm:flex-row sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md mb-2 sm:mb-0 flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex-1"
                >
                  {editingCenter ? "Update Center" : "Create Center"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Centers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 md:p-8 text-center">
            <RefreshCw className="w-6 h-6 md:w-8 md:h-8 animate-spin text-blue-600 mx-auto mb-3 md:mb-4" />
            <p className="text-sm md:text-base text-gray-600">
              Loading centers...
            </p>
          </div>
        ) : centers.length === 0 ? (
          <div className="p-6 md:p-8 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Search className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
              No centers found
            </h3>
            <p className="text-sm text-gray-600 mb-3 md:mb-4">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Get started by adding your first center."}
            </p>
            {!searchTerm && (
              <button
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm md:text-base"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2 inline" />
                Add First Center
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="hidden md:table min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {center.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{center.number}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div
                          className="text-sm text-gray-900 max-w-xs truncate"
                          title={center.address}
                        >
                          {center.address}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {center.state}, {center.lga}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
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
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500">
                        {formatDate(center.modifiedAt)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {center.modifiedBy ? `by ${center.modifiedBy}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
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

            {/* Mobile Cards - Improved */}
            <div className="md:hidden space-y-3 p-4">
              {centers.map((center) => (
                <div
                  key={center.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
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
                      <p
                        className="text-xs text-gray-600 line-clamp-2 mb-1"
                        title={center.address}
                      >
                        {center.address}
                      </p>
                      <div className="text-xs text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
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
                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(center)}
                        className="flex items-center text-blue-600 text-xs px-3 py-1 rounded border border-blue-200 bg-blue-50"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(center)}
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
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 px-4 py-3 rounded-lg gap-3">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} centers
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 min-w-[80px]"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600 flex items-center">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 min-w-[80px]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
            <div key={index} className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`h-6 w-6 md:h-8 md:w-8 ${colorClasses}`} />
                </div>
                <div className="ml-3 md:ml-4">
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity and API Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Centers */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200">
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              Recent Centers
            </h2>
          </div>
          <div className="p-4 md:p-6">
            {centers.length === 0 ? (
              <div className="text-center text-gray-500 py-4 md:py-6">
                <Building className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 text-gray-300" />
                <p className="text-sm md:text-base">No centers yet</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {centers.slice(0, 5).map((center) => (
                  <div
                    key={center.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
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
                    <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {formatShortDate(center.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* API Usage */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200">
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              API Usage
            </h2>
          </div>
          <div className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Public Lookup Endpoint
                </h3>
                <div className="bg-gray-100 p-2 md:p-3 rounded-lg">
                  <code className="text-xs md:text-sm text-gray-800 break-all">
                    GET /api/centers-lookup?number=CENTER_NUMBER
                  </code>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Public Access Available
                    </p>
                    <p className="text-xs text-blue-700">
                      External systems can query active centers without
                      authentication
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Available Endpoints
                </h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div>POST /api/centers - Create center</div>
                  <div>PUT /api/centers/:id - Update center</div>
                  <div>DELETE /api/centers/:id - Delete center</div>
                  <div>GET /api/centers/duplicates - Find duplicates</div>
                  <div>POST /api/centers/merge - Merge centers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
              action: () =>
                window.open("/api/centers-lookup?number=CTR001", "_blank"),
            },
            {
              icon: RefreshCw,
              label: "Refresh Data",
              description: "Reload all data",
              color: "purple",
              action: () => {
                loadCenters();
                loadStats();
                loadDuplicates();
              },
            },
          ].map((action, index) => {
            const Icon = action.icon;
            const colorClasses = {
              blue: "bg-blue-50 hover:bg-blue-100 text-blue-900",
              yellow: "bg-yellow-50 hover:bg-yellow-100 text-yellow-900",
              green: "bg-green-50 hover:bg-green-100 text-green-900",
              purple: "bg-purple-50 hover:bg-purple-100 text-purple-900",
            }[action.color];

            return (
              <button
                key={index}
                onClick={action.action}
                className={`flex items-center p-3 md:p-4 rounded-lg transition-colors ${colorClasses}`}
              >
                <Icon className="h-6 w-6 md:h-8 md:w-8 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-sm md:text-base">
                    {action.label}
                  </p>
                  <p className="text-xs">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* API Usage */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200">
          <h2 className="text-base md:text-lg font-medium text-gray-900">
            API Usage
          </h2>
        </div>
        <div className="p-4 md:p-6">
          <div className="space-y-3 md:space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Public Lookup Endpoint
              </h3>
              <div className="bg-gray-100 p-2 md:p-3 rounded-lg overflow-x-auto">
                <code className="text-xs md:text-sm text-gray-800 whitespace-nowrap">
                  GET /api/centers-lookup?number=CENTER_NUMBER
                </code>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center">
                <Eye className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Public Access Available
                  </p>
                  <p className="text-xs text-blue-700">
                    External systems can query active centers without
                    authentication
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Available Endpoints
              </h3>
              <div className="space-y-1 text-xs text-gray-600">
                <div>POST /api/centers - Create center</div>
                <div>PUT /api/centers/:id - Update center</div>
                <div>DELETE /api/centers/:id - Delete center</div>
                <div>GET /api/centers/duplicates - Find duplicates</div>
                <div>POST /api/centers/merge - Merge centers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
