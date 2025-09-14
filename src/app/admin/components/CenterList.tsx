"use client";
import { useState } from "react";
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
} from "lucide-react";

interface Center {
  id: string;
  number: string;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy: string | null;
}

interface CenterListProps {
  centers: Center[];
  loading: boolean;
  onEdit: (center: Center) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  includeInactive: boolean;
  onIncludeInactiveChange: (checked: boolean) => void;
  stats: Stats;
  recentCenters: Center[];
  error?: string | null;
  onRetry?: () => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  inactiveCenters: Center[];
  recentActivity: Center[];
}

export default function CenterList({
  centers,
  loading,
  onEdit,
  onDelete,
  onAdd,
  searchTerm,
  onSearchChange,
  includeInactive,
  onIncludeInactiveChange,
  stats,
  recentCenters,
  error,
  onRetry,
  pagination,
  onPageChange,
}: CenterListProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);

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

  const handleDelete = (center: Center) => {
    const action = center.isActive ? "deactivate" : "permanently delete";
    if (
      window.confirm(`Are you sure you want to ${action} "${center.name}"?`)
    ) {
      onDelete(center.id);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Header and Controls */}
      <div className="card p-4 md:p-6">
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
              <input
                type="text"
                placeholder="Search centers..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="input pl-9 md:pl-10 w-full sm:w-48 md:w-64 text-sm md:text-base"
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => onIncludeInactiveChange(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Include inactive
              </span>
            </label>

            <button
              onClick={onAdd}
              className="btn btn-primary flex items-center justify-center text-sm md:text-base py-2"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Add Center
            </button>
          </div>
        </div>
      </div>

      {/* Centers Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 md:p-8 text-center">
            <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-blue-600 border-t-transparent rounded-full spinner mx-auto mb-3 md:mb-4"></div>
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
                onClick={onAdd}
                className="btn btn-primary text-sm md:text-base"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
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
                    Address
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
                      <div
                        className="text-sm text-gray-900 max-w-xs truncate"
                        title={center.address}
                      >
                        {center.address}
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
                          onClick={() => onEdit(center)}
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

            {/* Mobile Cards */}
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
                        className="text-xs text-gray-600 line-clamp-2"
                        title={center.address}
                      >
                        {center.address}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setMobileMenuOpen(
                          mobileMenuOpen === center.id ? null : center.id
                        )
                      }
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {mobileMenuOpen === center.id && (
                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => onEdit(center)}
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
      {pagination && onPageChange && pagination.pages > 1 && (
        <div className="flex justify-between items-center mt-6 px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} centers
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="card p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {stats.active}
              </div>
              <div className="text-sm text-gray-600">Active Centers</div>
            </div>
          </div>
        </div>

        <div className="card p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {stats.inactive}
              </div>
              <div className="text-sm text-gray-600">Inactive Centers</div>
            </div>
          </div>
        </div>

        <div className="card p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {stats.recentActivity.length}
              </div>
              <div className="text-sm text-gray-600">Recent Updates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and API Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Centers */}
        <div className="card">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200">
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              Recent Centers
            </h2>
          </div>
          <div className="p-4 md:p-6">
            {recentCenters.length === 0 ? (
              <div className="text-center text-gray-500 py-4 md:py-6">
                <Building className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 text-gray-300" />
                <p className="text-sm md:text-base">No centers yet</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {recentCenters.slice(0, 5).map((center) => (
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
                            #{center.number}
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
        <div className="card">
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
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-4 md:p-6">
        <h2 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[
            {
              icon: Building,
              label: "Manage Centers",
              href: "/admin/centers",
              color: "blue",
            },
            {
              icon: Users,
              label: "View Sessions",
              href: "/admin/sessions",
              color: "green",
            },
            {
              icon: TrendingUp,
              label: "Analytics",
              href: "/admin/analytics",
              color: "purple",
            },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={index}
                href={action.href}
                className={`flex items-center p-3 md:p-4 bg-${action.color}-50 hover:bg-${action.color}-100 rounded-lg transition-colors`}
              >
                <Icon
                  className={`h-6 w-6 md:h-8 md:w-8 text-${action.color}-600 mr-3`}
                />
                <div>
                  <p
                    className={`font-medium text-${action.color}-900 text-sm md:text-base`}
                  >
                    {action.label}
                  </p>
                  <p className={`text-xs text-${action.color}-700`}>
                    {action.label === "Manage Centers" &&
                      "Add, edit, or remove centers"}
                    {action.label === "View Sessions" &&
                      "Monitor active admin sessions"}
                    {action.label === "Analytics" && "View usage statistics"}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
