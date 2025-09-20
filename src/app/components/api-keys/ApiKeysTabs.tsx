// src/app/components/api-keys/ApiKeysTabs.tsx
interface ApiKeysTabsProps {
  activeTab: "create" | "manage";
  onTabChange: (tab: "create" | "manage") => void;
  keyCount: number;
}

export default function ApiKeysTabs({
  activeTab,
  onTabChange,
  keyCount,
}: ApiKeysTabsProps) {
  return (
    <div className="border-b border-border mb-8">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange("create")}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "create"
              ? "border-primary text-primary"
              : "border-transparent text-foreground/70 hover:text-foreground hover:border-border"
          }`}
        >
          Create New Key
        </button>
        <button
          onClick={() => onTabChange("manage")}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "manage"
              ? "border-primary text-primary"
              : "border-transparent text-foreground/70 hover:text-foreground hover:border-border"
          }`}
        >
          Manage Keys ({keyCount})
        </button>
      </nav>
    </div>
  );
}
