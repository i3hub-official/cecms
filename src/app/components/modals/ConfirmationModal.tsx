// src/app/components/modals/ConfirmationModal.tsx
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { ConfirmationModalState } from "@/types/center";

interface ConfirmationModalProps {
  modal: ConfirmationModalState;
  onClose: () => void;
}

export default function ConfirmationModal({
  modal,
  onClose,
}: ConfirmationModalProps) {
  if (!modal.isOpen) return null;

  const handleCancel = () => {
    modal.onCancel?.(); // only call if provided
    onClose();
  };

  const handleConfirm = () => {
    modal.onConfirm?.();
    onClose();
  };

  const confirmClasses =
    modal.type === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
      : modal.type === "warning"
      ? "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500"
      : "bg-primary hover:bg-primary/90 text-white focus:ring-primary";

  return (
    <div
      className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center mb-4">
          {modal.type === "danger" && (
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
          )}
          {modal.type === "warning" && (
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 mr-3" />
          )}
          {modal.type === "info" && (
            <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
          )}
          <h3 id="modal-title" className="text-lg font-medium text-foreground">
            {modal.title}
          </h3>
        </div>

        {/* Body */}
        <p id="modal-description" className="text-foreground/70 mb-6">
          {modal.message}
        </p>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:space-x-3">
          <button
            onClick={handleCancel}
            className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 text-foreground bg-background border border-border rounded-md hover:bg-card transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            {modal.cancelText ?? "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            className={`w-full sm:w-auto px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-colors ${confirmClasses}`}
          >
            {modal.confirmText ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
