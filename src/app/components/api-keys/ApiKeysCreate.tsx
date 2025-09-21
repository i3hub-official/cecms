'use client'
// src/app/components/api-keys/ApiKeysCreate.tsx
import { useState } from "react";
import { ApiKeyFormData } from "@/types/api-keys";

const ENDPOINT_OPTIONS = [
  {
    value: "*",
    label: "All Endpoints",
    description: "Access to all available API endpoints",
    icon: "🌐",
    recommended: true,
  },
  {
    value: "/apis/v1/center-lookup",
    label: "Center Lookup Only",
    description: "Only center lookup functionality",
    icon: "🔍",
  },
  {
    value: "/apis/v1/dispute-center/*",
    label: "Dispute Center",
    description: "All dispute center related endpoints",
    icon: "⚖️",
  },
  {
    value: "/apis/v1/helper/*",
    label: "Helper Endpoints",
    description: "Utility and helper endpoints",
    icon: "🛠️",
  },
  {
    value: "/apis/v1/user/*",
    label: "User Management",
    description: "User profile and settings endpoints",
    icon: "👤",
  },
  {
    value: "/apis/v1/reports/*",
    label: "Reports",
    description: "Reporting and analytics endpoints",
    icon: "📊",
  },
];

const RATE_LIMIT_OPTIONS = [
  { 
    value: 10, 
    label: "10 requests/hour", 
    tier: "Basic",
    description: "Perfect for development and testing",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  },
  { 
    value: 100, 
    label: "100 requests/hour", 
    tier: "Standard",
    description: "Ideal for small to medium applications",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    recommended: true
  },
  { 
    value: 500, 
    label: "500 requests/hour", 
    tier: "Premium",
    description: "Great for high-traffic applications",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
  },
  { 
    value: 1000, 
    label: "1000 requests/hour", 
    tier: "Enterprise",
    description: "Maximum throughput for enterprise needs",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
  },
];

const EXPIRATION_PRESETS = [
  { days: 30, label: "30 days", description: "Short-term testing" },
  { days: 90, label: "3 months", description: "Quarterly projects" },
  { days: 365, label: "1 year", description: "Long-term production", recommended: true },
  { days: 730, label: "2 years", description: "Extended projects" },
];

interface ApiKeysCreateProps {
  onCreateSuccess: (newKey: {
    id: string;
    apiKey: string;
    keyId: string;
    name: string;
    prefix: string;
    expiresAt: string;
    createdAt: string;
  }) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

// Sub-components
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex items-center justify-between mb-8">
    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
      <div key={step} className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {step <= currentStep ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            step
          )}
        </div>
        {step < totalSteps && (
          <div className={`flex-1 h-1 mx-4 rounded ${
            step < currentStep ? 'bg-primary' : 'bg-muted'
          }`} />
        )}
      </div>
    ))}
  </div>
);

const FormSection = ({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description?: string; 
  children: React.ReactNode 
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
    {children}
  </div>
);

const PermissionCard = ({ 
  id, 
  title, 
  description, 
  checked, 
  onChange, 
  icon,
  danger = false 
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: string;
  danger?: boolean;
}) => (
  <label 
    htmlFor={id}
    className={`relative flex items-start p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${
      checked 
        ? danger 
          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          : 'border-primary bg-primary/5 dark:bg-primary/10'
        : 'border-border bg-card hover:border-border/80'
    }`}
  >
    <div className="flex items-center h-5">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary rounded border-border focus:ring-primary focus:ring-2"
      />
    </div>
    <div className="ml-3 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  </label>
);

const EndpointOption = ({ 
  option, 
  selected, 
  onSelect 
}: { 
  option: typeof ENDPOINT_OPTIONS[0]; 
  selected: boolean; 
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`relative p-4 text-left border rounded-xl transition-all hover:shadow-md w-full ${
      selected 
        ? 'border-primary bg-primary/5 dark:bg-primary/10'
        : 'border-border bg-card hover:border-border/80'
    }`}
  >
    <div className="flex items-start gap-3">
      <span className="text-2xl flex-shrink-0">{option.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground truncate">{option.label}</h4>
          {option.recommended && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Recommended
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
      </div>
      {selected && (
        <div className="absolute top-2 right-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  </button>
);

const RateLimitOption = ({ 
  option, 
  selected, 
  onSelect 
}: { 
  option: typeof RATE_LIMIT_OPTIONS[0]; 
  selected: boolean; 
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`relative p-4 text-left border rounded-xl transition-all hover:shadow-md w-full ${
      selected 
        ? 'border-primary bg-primary/5 dark:bg-primary/10'
        : 'border-border bg-card hover:border-border/80'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-medium text-foreground">{option.label}</h4>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${option.color}`}>
            {option.tier}
          </span>
          {option.recommended && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Recommended
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{option.description}</p>
      </div>
      {selected && (
        <svg className="w-4 h-4 text-primary flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  </button>
);

export default function ApiKeysCreate({
  onCreateSuccess,
  onError,
  onCancel,
}: ApiKeysCreateProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<ApiKeyFormData>({
    name: "",
    description: "",
    canRead: true,
    canWrite: false,
    canDelete: false,
    allowedEndpoints: "*",
    rateLimit: 100,
    expiresInDays: 365,
  });

  const totalSteps = 4;

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.canRead || formData.canWrite || formData.canDelete;
      case 3:
        return true; // Access controls are always valid
      case 4:
        return formData.expiresInDays > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createApiKey = async () => {
    if (!formData.name.trim()) {
      onError("Name is required");
      return;
    }

    if (!formData.canRead && !formData.canWrite && !formData.canDelete) {
      onError("At least one permission must be selected");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/apis/v1/user/api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      onCreateSuccess(data.data);

      // Reset form
      setFormData({
        name: "",
        description: "",
        canRead: true,
        canWrite: false,
        canDelete: false,
        allowedEndpoints: "*",
        rateLimit: 100,
        expiresInDays: 365,
      });
      setCurrentStep(1);
    } catch (error) {
      console.error("Failed to create API key:", error);
      onError(
        error instanceof Error ? error.message : "Failed to create API key"
      );
    } finally {
      setCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <FormSection 
            title="Basic Information" 
            description="Give your API key a name and description to help you identify its purpose."
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  API Key Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
                  placeholder="e.g., Production App, Mobile Client, Analytics Service"
                  maxLength={50}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Choose a descriptive name that helps you identify this key&apos;s purpose.
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors resize-none"
                  placeholder="Add additional details about how this API key will be used..."
                  maxLength={200}
                  rows={3}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {formData.description.length}/200 characters
                </p>
              </div>
            </div>
          </FormSection>
        );

      case 2:
        return (
          <FormSection 
            title="Permissions" 
            description="Select what actions this API key can perform. Choose carefully - you can always create a new key with different permissions."
          >
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
              <PermissionCard
                id="canRead"
                title="Read"
                description="View and retrieve data from the API"
                icon="👁️"
                checked={formData.canRead}
                onChange={(checked) => setFormData({ ...formData, canRead: checked })}
              />
              
              <PermissionCard
                id="canWrite"
                title="Write"
                description="Create and modify data through the API"
                icon="✏️"
                checked={formData.canWrite}
                onChange={(checked) => setFormData({ ...formData, canWrite: checked })}
              />
              
              <PermissionCard
                id="canDelete"
                title="Delete"
                description="Remove data from the system (use with caution)"
                icon="🗑️"
                checked={formData.canDelete}
                onChange={(checked) => setFormData({ ...formData, canDelete: checked })}
                danger
              />
            </div>
            
            {!formData.canRead && !formData.canWrite && !formData.canDelete && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-orange-800 dark:text-orange-200">Select at least one permission</p>
                    <p className="text-orange-700 dark:text-orange-300 mt-1">An API key without permissions won&apos;t be able to access any endpoints.</p>
                  </div>
                </div>
              </div>
            )}
          </FormSection>
        );

      case 3:
        return (
          <FormSection 
            title="Access Controls" 
            description="Configure which endpoints this key can access and set rate limits to prevent abuse."
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Allowed Endpoints
                </label>
                <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                  {ENDPOINT_OPTIONS.map((option) => (
                    <EndpointOption
                      key={option.value}
                      option={option}
                      selected={formData.allowedEndpoints === option.value}
                      onSelect={() => setFormData({ ...formData, allowedEndpoints: option.value })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Rate Limit
                </label>
                <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                  {RATE_LIMIT_OPTIONS.map((option) => (
                    <RateLimitOption
                      key={option.value}
                      option={option}
                      selected={formData.rateLimit === option.value}
                      onSelect={() => setFormData({ ...formData, rateLimit: option.value })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </FormSection>
        );

      case 4:
        return (
          <FormSection 
            title="Expiration Settings" 
            description="Set when this API key should automatically expire for security purposes."
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Quick Presets
                </label>
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                  {EXPIRATION_PRESETS.map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setFormData({ ...formData, expiresInDays: preset.days })}
                      className={`p-3 text-left border rounded-lg transition-all ${
                        formData.expiresInDays === preset.days
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-border bg-card hover:border-border/80'
                      }`}
                    >
                      <div className="font-medium text-sm text-foreground">{preset.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{preset.description}</div>
                      {preset.recommended && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Recommended
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div>
                  <label htmlFor="expiresInDays" className="block text-sm font-medium text-foreground mb-2">
                    Custom Duration (Days)
                  </label>
                  <input
                    id="expiresInDays"
                    type="number"
                    min="1"
                    max="3650"
                    value={formData.expiresInDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expiresInDays: Math.max(1, Math.min(3650, parseInt(e.target.value) || 1)),
                      })
                    }
                    className="w-32 px-3 py-2 border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Expiration Date</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(Date.now() + formData.expiresInDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create New API Key</h1>
          <p className="text-muted-foreground">
            Follow the steps below to generate a new API key with the right permissions and settings.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-border">
          <div className="flex gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
            )}
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!validateCurrentStep()}
                className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Next Step
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={createApiKey}
                disabled={creating || !validateCurrentStep()}
                className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {creating && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {creating ? "Creating API Key..." : "Generate API Key"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
