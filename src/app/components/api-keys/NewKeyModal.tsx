// src/app/components/api-keys/NewKeyModal.tsx
interface NewKeyModalProps {
  newKey: { apiKey: string; name: string; prefix: string };
  onClose: () => void;
  onCopy: () => void;
}

export default function NewKeyModal({
  newKey,
  onClose,
  onCopy,
}: NewKeyModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            🎉 API Key Created!
          </h2>
          <p className="text-gray-600 mb-4">
            Your new API key for <strong>{newKey.name}</strong> has been
            generated.
          </p>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <div className="font-mono text-sm break-all text-gray-800">
              {newKey.apiKey}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Prefix: {newKey.prefix}
            </div>
          </div>

          <p className="text-red-500 text-sm mb-4">
            ⚠️ Make sure to copy this key now. You won&apos;t be able to see it
            again!
          </p>

          <div className="flex space-x-3 justify-center">
            <button
              onClick={onCopy}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Copy API Key
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
