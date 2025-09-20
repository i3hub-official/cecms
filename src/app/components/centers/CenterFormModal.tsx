// src/app/components/centers/CenterFormModal.tsx
import { useState, useEffect } from "react";
import { X, AlertCircle, RefreshCw } from "lucide-react";
import { Center } from "@/types/center";

interface CenterFormModalProps {
  showForm: boolean;
  editingCenter: Center | null;
  formData: {
    name: string;
    address: string;
    state: string;
    lga: string;
    isActive: boolean;
  };
  formErrors: { [key: string]: string };
  states: string[];
  lgas: string[];
  isLoadingLgas: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  onFormChange: (field: string, value: string | boolean) => void;
}

export default function CenterFormModal({
  showForm,
  editingCenter,
  formData,
  formErrors,
  states,
  lgas,
  isLoadingLgas,
  isSubmitting,
  onClose,
  onSubmit,
  onFormChange,
}: CenterFormModalProps) {
  if (!showForm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Modal content */}
      <div className="relative bg-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {editingCenter ? "Edit Center" : "Add New Center"}
            </h2>
            <button
              onClick={isSubmitting ? undefined : onClose}
              disabled={isSubmitting}
              className="text-foreground/50 hover:text-foreground p-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={onSubmit} className="p-4 space-y-4">
            {/* Center Name Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Center Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onFormChange("name", e.target.value)}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-background text-foreground ${
                  formErrors.name
                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                    : "border-border"
                }`}
                placeholder="Enter center name"
              />
              {formErrors.name && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
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
                onChange={(e) => onFormChange("address", e.target.value)}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-background text-foreground ${
                  formErrors.address
                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                    : "border-border"
                }`}
                rows={2}
                placeholder="Enter full address"
              />
              {formErrors.address && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
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
                onChange={(e) => onFormChange("state", e.target.value)}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-background text-foreground ${
                  formErrors.state
                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                    : "border-border"
                }`}
              >
                <option value="">Select State</option>
                {states
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
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
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
                onChange={(e) => onFormChange("lga", e.target.value)}
                disabled={!formData.state || isLoadingLgas || isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-background text-foreground ${
                  formErrors.lga
                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
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
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {formErrors.lga}
                </p>
              )}
              {isLoadingLgas && (
                <p className="text-blue-600 dark:text-blue-400 text-xs mt-1 flex items-center">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Loading LGAs...
                </p>
              )}
              {!formData.state && !formErrors.lga && !isLoadingLgas && (
                <p className="text-foreground/70 text-xs mt-1">
                  Select state first
                </p>
              )}
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center bg-background/50 p-3 rounded-lg border border-border">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => onFormChange("isActive", e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="ml-2">
                <span className="text-sm text-foreground">Active Center</span>
                <p className="text-xs text-foreground/70">
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
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 text-foreground bg-background border border-border rounded-lg hover:bg-card text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  );
}