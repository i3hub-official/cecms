"use client";
import React from "react";
import { useRouter } from "next/navigation";

const FooterContext: React.FC = () => {
  const router = useRouter();

  return (
    <footer className="bg-background rounded-2xl shadow-sm border border-border p-6 transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Text */}
        <div>
          <h3 className="font-semibold text-foreground">Need Help?</h3>
          <p className="text-sm text-muted-foreground">
            Access documentation, support tickets, and system guides.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/docs")}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Documentation
          </button>
          <button
            onClick={() => router.push("/support")}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </footer>
  );
};

export default FooterContext;
