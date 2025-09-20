// src/app/components/api-keys/ApiKeysTabs.tsx
interface ApiKeysTabsProps {
  activeTab: 'create' | 'manage';
  onTabChange: (tab: 'create' | 'manage') => void;
  keyCount: number;
}

export default function ApiKeysTabs({ activeTab, onTabChange, keyCount }: ApiKeysTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-8">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('create')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'create'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Create New Key
        </button>
        <button
          onClick={() => onTabChange('manage')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'manage'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Manage Keys ({keyCount})
        </button>
      </nav>
    </div>
  );
}