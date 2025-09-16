"use client";
import React from "react";

const FooterContext: React.FC = () => {
  return (
    <div className="bg-background rounded-2xl shadow-sm border border-border p-6 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Need Help?</h3>
          <p className="text-sm text-muted-foreground">
            Access documentation, support tickets, and system guides
          </p>
        </div>
        <div className="flex space-x-4">
          <button className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted transition-colors">
            Documentation
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default FooterContext;
