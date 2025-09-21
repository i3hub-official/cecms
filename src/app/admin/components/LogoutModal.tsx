// File: src/app/admin/components/LogoutModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut, AlertTriangle, X, Database, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({
  open,
  onClose,
  onConfirm,
}: LogoutModalProps) {
  const { cache, mutate } = useSWRConfig();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !isLoggingOut) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose, isLoggingOut]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setIsLoggingOut(false);
      setCacheCleared(false);
    }
  }, [open]);

  const clearSWRCache = async () => {
    try {
      // Get cache statistics before clearing
      const cacheKeys = Array.from(cache.keys());
      console.log(`Clearing ${cacheKeys.length} cached entries...`);

      // Clear specific dashboard-related cache entries first
      const dashboardKeys = cacheKeys.filter(key => 
        typeof key === 'string' && (
          key.includes('/api/dashboard') ||
          key.includes('/api/centers') ||
          key.includes('/api/admin') ||
          key.includes('/api/sessions') ||
          key.includes('/api/settings')
        )
      );

      // Invalidate dashboard-specific cache entries
      await Promise.all(
        dashboardKeys.map(key => 
          mutate(key, undefined, { revalidate: false })
        )
      );

      // Clear all cache after a brief delay
      setTimeout(() => {
        Array.from(cache.keys()).forEach(key => cache.delete(key));
        setCacheCleared(true);
        console.log('✅ SWR cache cleared successfully');
      }, 100);

    } catch (error) {
      console.error('❌ Error clearing SWR cache:', error);
      // Still proceed with logout even if cache clearing fails
      setCacheCleared(true);
    }
  };

  const handleConfirm = async () => {
    if (isLoggingOut) return; // Prevent double-click
    
    setIsLoggingOut(true);

    try {
      // Step 1: Clear SWR cache
      await clearSWRCache();

      // Step 2: Small delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Close modal and proceed with logout
      onClose();
      
      // Step 4: Execute logout with small delay for modal animation
      setTimeout(() => {
        onConfirm();
      }, 150);

    } catch (error) {
      console.error('Logout process error:', error);
      // Still proceed with logout on error
      onClose();
      setTimeout(() => {
        onConfirm();
      }, 150);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="logout-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={!isLoggingOut ? onClose : undefined}
        >
          <motion.div
            key="logout-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              duration: 0.25,
              ease: [0.4, 0.0, 0.2, 1], // Custom easing for smoother animation
            }}
            className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Sign Out
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {isLoggingOut ? 'Signing out...' : 'End your current session'}
                    </p>
                  </div>
                </div>

                {!isLoggingOut && (
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-medium mb-2">
                    Are you sure you want to sign out?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll need to sign in again to access your dashboard
                    and manage your account.
                  </p>
                </div>
              </div>

              {/* Logout progress indicator */}
              {isLoggingOut && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Database className={`w-4 h-4 text-orange-500 ${cacheCleared ? '' : 'animate-pulse'}`} />
                      <span className="text-sm text-orange-700 dark:text-orange-300">
                        {cacheCleared ? '✓ Cache cleared' : 'Clearing cache...'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-orange-200 dark:bg-orange-900/30 rounded-full h-1">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: cacheCleared ? "100%" : "60%" }}
                      transition={{ duration: 0.5 }}
                      className="bg-orange-500 h-1 rounded-full"
                    />
                  </div>
                </motion.div>
              )}

              {/* Security reminder */}
              {!isLoggingOut && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                        Make sure to save any unsaved changes before signing out.
                      </p>
                      <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                        Your cached data will be cleared for security.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-border bg-muted/30">
              <div className="flex justify-end gap-3">
                {!isLoggingOut && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-border/80 rounded-lg hover:bg-muted/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    Cancel
                  </motion.button>
                )}

                <motion.button
                  whileHover={!isLoggingOut ? { scale: 1.02 } : {}}
                  whileTap={!isLoggingOut ? { scale: 0.98 } : {}}
                  onClick={handleConfirm}
                  disabled={isLoggingOut}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 shadow-sm flex items-center gap-2 ${
                    isLoggingOut
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 hover:shadow-md'
                  } text-white`}
                >
                  {isLoggingOut ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.div>
                      Signing Out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}